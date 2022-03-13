# Kong Memory Leak Configuration Reload

Repository used to reproduce kong configuration excessive reload when ingress has same SNIs and use same secrets with same `creationTimestamp`

## Setup

```bash
npm install
k3d cluster create -c cluster.yml # Or use any kubernetes cluster

pulumi up --yes
```
