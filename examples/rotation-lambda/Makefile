.PHONY: install-deps
install-deps:
	npm -C cdk install

.PHONY: deploy
deploy: install-deps
	# Rebuild lambda
	npm -C lambdas/rotation-lambda run build
	mkdir -p build
	cd lambdas/rotation-lambda && zip -r ../../build/rotation-lambda.zip index.js
	npm -C cdk run cdk -- deploy --outputs-file outputs.json
