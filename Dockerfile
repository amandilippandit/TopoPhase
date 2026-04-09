FROM python:3.12-slim

WORKDIR /app

# Install system deps for gudhi and torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY pyproject.toml .
COPY sim/ sim/
COPY topo/ topo/
COPY gnn/ gnn/
COPY api/ api/

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir . && \
    pip install --no-cache-dir scikit-learn

# Generate data and train model at build time
RUN python -m gnn.generate_data && python -m gnn.train

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
