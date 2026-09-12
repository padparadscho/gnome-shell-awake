.PHONY: check format lint compile install

check:
	pnpm run check

format:
	pnpm run format

lint:
	pnpm run lint

compile:
	./scripts/compile.sh

install:
	./scripts/install.sh
