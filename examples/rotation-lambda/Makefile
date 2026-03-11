.PHONY: install-deps
install-deps:
	npm install

.PHONY: deploy
deploy: install-deps
	# Rebuild lambda
	npm -w lambdas/rotation-lambda run build
	mkdir -p build
	cd lambdas/rotation-lambda && zip -r ../../build/rotation-lambda.zip index.js
	npm -w cdk run cdk -- deploy --outputs-file outputs.json
