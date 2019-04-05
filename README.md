# Accord Project Template Library

[![Build Status](https://travis-ci.org/accordproject/cicero-template-library.svg?branch=master)](https://travis-ci.org/accordproject/cicero-template-library)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

Repository for Smart Legal Contract Templates that conform that to the [Accord Project Template Specification](https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0), the protocol is managed by the open-source community of the [Accord Project](https://accordproject.org). 

These templates can be parsed and executed by the [Cicero](https://github.com/accordproject/cicero) engine.

## Library

The contents of this repository is automatically tested, built and published to the 
Accord Project Template Library, hosted at https://templates.accordproject.org.

## Contributing

Can't find a something? Then why not make a new template yourself? 

[Follow the instuctions in the docs.](https://docs.accordproject.org/docs/cicero-tutorial.html#creating-a-new-template)

## Testing

To install and test all the templates locally, clone this repository and use lerna:
```
npm install -g lerna@^2.11.0
lerna bootstrap
lerna run test
```

## License

All templates in this library are made available under the [Apache-2 License](LICENSE).
