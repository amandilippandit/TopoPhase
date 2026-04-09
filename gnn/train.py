"""Train the TopoGNN on the synthetic phase dataset."""

import os

import numpy as np
import torch
from sklearn.metrics import confusion_matrix, roc_auc_score
from torch_geometric.loader import DataLoader

from gnn.model import TopoGNN


def main() -> None:
    dataset = torch.load("data/phase_dataset.pt", weights_only=False)
    print(f"Loaded {len(dataset)} samples")

    labels = np.array([int(d.y.item()) for d in dataset])
    indices = np.arange(len(dataset))
    rng = np.random.default_rng(42)

    train_idx, val_idx = [], []
    for cls in [0, 1, 2]:
        cls_indices = indices[labels == cls]
        rng.shuffle(cls_indices)
        split = int(0.8 * len(cls_indices))
        train_idx.extend(cls_indices[:split].tolist())
        val_idx.extend(cls_indices[split:].tolist())

    train_set = [dataset[i] for i in train_idx]
    val_set = [dataset[i] for i in val_idx]
    print(f"Train: {len(train_set)}, Val: {len(val_set)}")

    train_loader = DataLoader(train_set, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=16, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = TopoGNN(in_channels=6, hidden=64, n_classes=3).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5)

    phase_criterion = torch.nn.CrossEntropyLoss()
    transition_criterion = torch.nn.BCELoss()

    best_val_acc = 0.0
    os.makedirs("checkpoints", exist_ok=True)

    for epoch in range(1, 101):
        # Training
        model.train()
        total_loss = 0.0
        n_batches = 0
        for batch in train_loader:
            batch = batch.to(device)
            optimizer.zero_grad()
            phase_logits, trans_prob = model(batch)
            phase_loss = phase_criterion(phase_logits, batch.y)
            trans_label = (batch.y == 1).float().unsqueeze(1)
            trans_loss = transition_criterion(trans_prob, trans_label)
            loss = phase_loss + 0.5 * trans_loss
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            n_batches += 1

        avg_train_loss = total_loss / max(n_batches, 1)

        # Validation
        model.eval()
        correct = 0
        total = 0
        val_loss_sum = 0.0
        val_batches = 0
        all_probs = []
        all_labels = []
        with torch.no_grad():
            for batch in val_loader:
                batch = batch.to(device)
                phase_logits, trans_prob = model(batch)
                phase_loss = phase_criterion(phase_logits, batch.y)
                trans_label = (batch.y == 1).float().unsqueeze(1)
                trans_loss = transition_criterion(trans_prob, trans_label)
                val_loss_sum += (phase_loss + 0.5 * trans_loss).item()
                val_batches += 1

                preds = phase_logits.argmax(dim=1)
                correct += (preds == batch.y).sum().item()
                total += batch.y.size(0)

                probs = torch.softmax(phase_logits, dim=1).cpu().numpy()
                all_probs.append(probs)
                all_labels.append(batch.y.cpu().numpy())

        val_acc = correct / max(total, 1)
        avg_val_loss = val_loss_sum / max(val_batches, 1)
        scheduler.step(avg_val_loss)

        all_probs_np = np.concatenate(all_probs, axis=0)
        all_labels_np = np.concatenate(all_labels, axis=0)
        try:
            val_auc = roc_auc_score(
                all_labels_np, all_probs_np, multi_class="ovr", average="macro"
            )
        except ValueError:
            val_auc = 0.0

        print(
            f"Epoch {epoch:3d} | train_loss={avg_train_loss:.4f} | "
            f"val_loss={avg_val_loss:.4f} | val_acc={val_acc:.3f} | "
            f"val_auc={val_auc:.3f}"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), "checkpoints/topognn.pt")
            print(f"  -> Saved best model (acc={best_val_acc:.3f})")

    # Final report
    print(f"\nBest validation accuracy: {best_val_acc:.3f}")
    model.load_state_dict(torch.load("checkpoints/topognn.pt", weights_only=True))
    model.eval()
    all_preds = []
    all_true = []
    with torch.no_grad():
        for batch in val_loader:
            batch = batch.to(device)
            phase_logits, _ = model(batch)
            all_preds.extend(phase_logits.argmax(dim=1).cpu().tolist())
            all_true.extend(batch.y.cpu().tolist())

    cm = confusion_matrix(all_true, all_preds, labels=[0, 1, 2])
    print(f"\nConfusion matrix (ordered/critical/disordered):\n{cm}")


if __name__ == "__main__":
    main()
