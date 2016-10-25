IMAGE_NAME = webmemex-local
CONTAINER_NAME = webmemex
DOCKER_ARGS =  -p 8086:8086 --link pywb-webrecorder --name ${CONTAINER_NAME} ${IMAGE_NAME}
ENV = MEMEX_PROXY_URL_PREFIX=/live/

.PHONY: run
run:
	docker run --rm -it ${DOCKER_ARGS}

.PHONY: rund
rund:
	docker run -d ${DOCKER_ARGS}

.PHONY: stopd
stopd:
	docker rm -f ${CONTAINER_NAME}

.PHONY: dev
dev:
	${ENV} npm run watch &
	docker run --rm -it -v `pwd`/app:/app ${DOCKER_ARGS}

.PHONY: build
build: build-prod build-image

.PHONY: build-image
build-image:
	docker build -t ${IMAGE_NAME} app

.PHONY: build-prod
build-prod:
	${ENV} npm run build-prod

.PHONY: build-dev
build-dev:
	${ENV} npm run build-dev
