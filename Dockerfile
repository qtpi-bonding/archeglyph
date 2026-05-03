FROM bufbuild/buf:latest AS buf-source

FROM oven/bun:1
WORKDIR /workspace
COPY --from=buf-source /usr/local/bin/buf /usr/local/bin/buf
