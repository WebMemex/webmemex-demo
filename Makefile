.PHONY: test
test: build-docker
	docker run --rm -it -p 8086:8086 --link pywb-webrecorder --name webmemex webmemex-local

.PHONY: start
start:
	docker run -d -p 8086:8086 --link pywb-webrecorder --name webmemex webmemex-local

.PHONY: build
build: build-prod build-docker

.PHONY: build-docker
build-docker:
	docker build -t webmemex-local app

.PHONY: build-prod
build-prod:
	npm run build-prod

.PHONY: build-dev
build-dev:
	npm run build-dev
