#!/bin/bash

set -eux

LIMIT_LEDGER_SIZE=500000000

NOOP_PROGRAM_ID="noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
MERKLE_TREE_PROGRAM_ID="JA5cjkRJ1euVi9xLWsCJVzsRzEkT8vcC4rqw9sVAo5d6"
VERIFIER_PROGRAM_ZERO_ID="J1RRetZ4ujphU75LP8RadjXMf3sA12yC2R44CF7PmU7i"
VERIFIER_PROGRAM_STORAGE_ID="DJpbogMSrK94E1zvvJydtkqoE4sknuzmMRoutd6B7TKj"
VERIFIER_PROGRAM_ONE_ID="3KS2k14CmtnuVv2fvYcvdrNgC94Y11WETBpMUGgXyWZL"
VERIFIER_PROGRAM_TWO_ID="GFDwN8PXuKZG2d2JLxRhbggXYe9eQHoGYoYK5K3G5tV8"
MOCK_VERIFIER_PROGRAM_ID="Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

solana config set --url http://localhost:8899

docker rm -f solana-validator || true
    docker run -d \
        --name solana-validator \
        --pull=always \
        -p 8899:8899 \
        -p 8900:8900 \
        -p 8901:8901 \
        -p 8902:8902 \
        -p 9900:9900 \
        -p 8000:8000 \
        -p 8001:8001 \
        -p 8002:8002 \
        -p 8003:8003 \
        -p 8004:8004 \
        -p 8005:8005 \
        -p 8006:8006 \
        -p 8007:8007 \
        -p 8008:8008 \
        -p 8009:8009 \
        -v $HOME/.config/solana/id.json:/root/.config/solana/id.json \
        ghcr.io/lightprotocol/solana-test-validator:main \
        --reset \
        --limit-ledger-size=$LIMIT_LEDGER_SIZE \
        --quiet \
        --bpf-program $NOOP_PROGRAM_ID /home/node/.local/light-protocol/lib/solana-program-library/spl_noop.so \
        --bpf-program $MERKLE_TREE_PROGRAM_ID /home/node/.local/light-protocol/lib/light-protocol/merkle_tree_program.so \
        --bpf-program $VERIFIER_PROGRAM_ZERO_ID /home/node/.local/light-protocol/lib/light-protocol/verifier_program_zero.so \
        --bpf-program $VERIFIER_PROGRAM_STORAGE_ID /home/node/.local/light-protocol/lib/light-protocol/verifier_program_storage.so \
        --bpf-program $VERIFIER_PROGRAM_ONE_ID /home/node/.local/light-protocol/lib/light-protocol/verifier_program_one.so \
        --bpf-program $VERIFIER_PROGRAM_TWO_ID /home/node/.local/light-protocol/lib/light-protocol/verifier_program_two.so \
        --account-dir /home/node/.local/light-protocol/lib/accounts
    trap "docker rm -f solana-validator" EXIT

    sleep 15
    $1