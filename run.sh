#!/bin/bash

# Generate gRPC code
python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/data_service.proto
python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/model_service.proto
python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/analytics_service.proto

# Build and start services
docker-compose up --build
