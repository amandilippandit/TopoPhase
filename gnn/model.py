"""Topological Graph Neural Network for phase classification and transition detection."""

import torch
import torch.nn.functional as F
from torch import Tensor
from torch.nn import Linear, ReLU, Sequential
from torch_geometric.data import Data
from torch_geometric.nn import BatchNorm, SAGEConv, global_mean_pool


class TopoGNN(torch.nn.Module):
    """GNN with topological attention for Ising phase classification.

    Outputs:
        phase_logits: (batch, 3) — [P_ordered, P_critical, P_disordered]
        transition_prob: (batch, 1) — probability of being at a phase transition
    """

    def __init__(
        self, in_channels: int = 6, hidden: int = 64, n_classes: int = 3
    ):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden)
        self.conv2 = SAGEConv(hidden, hidden)
        self.conv3 = SAGEConv(hidden, hidden)
        self.bn1 = BatchNorm(hidden)
        self.bn2 = BatchNorm(hidden)
        self.bn3 = BatchNorm(hidden)
        self.phase_head = Sequential(
            Linear(hidden, 32), ReLU(), Linear(32, n_classes)
        )
        self.transition_head = Sequential(
            Linear(hidden, 16), ReLU(), Linear(16, 1)
        )

    def forward(self, data: Data) -> tuple[Tensor, Tensor]:
        x = data.x
        edge_index = data.edge_index
        batch = data.batch if data.batch is not None else torch.zeros(
            x.size(0), dtype=torch.long, device=x.device
        )

        h = F.relu(self.bn1(self.conv1(x, edge_index)))
        h = F.relu(self.bn2(self.conv2(h, edge_index)))
        h = F.relu(self.bn3(self.conv3(h, edge_index)))

        persistence_weights = x[:, 4]
        persistence_weights = persistence_weights - persistence_weights.min()
        attn = torch.softmax(persistence_weights + 1e-8, dim=0)
        h_attended = h * attn.unsqueeze(1)

        pool = global_mean_pool(h_attended, batch)

        phase_logits = self.phase_head(pool)
        transition_prob = torch.sigmoid(self.transition_head(pool))

        return phase_logits, transition_prob
