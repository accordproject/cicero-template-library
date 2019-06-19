<a href="https://docs.accordproject.org/">
	<img src="assets/images/APLogo.png" alt="Accord Project Logo" />
</a>

# Accord Project Template Library

[![Build Status](https://travis-ci.org/accordproject/cicero-template-library.svg?branch=master)](https://travis-ci.org/accordproject/cicero-template-library)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

Repository for Smart Legal Contract Templates that conform that to the [Accord Project Template Specification][techspec], the protocol is managed by the open-source community of the [Accord Project][aphome]. 

These templates can be parsed and executed by the [Cicero][cicero] engine.

## Library

The contents of this repository is automatically tested, built and published to the 
Accord Project Template Library, hosted at https://templates.accordproject.org.

## Contributing

Can't find a something? Then why not make a new template yourself? 

[Follow the instuctions in the docs.][ctlguide]

## Testing

To install and test all the templates locally, clone this repository and use lerna:
```
npm install -g lerna@^2.11.0
lerna bootstrap
lerna run test
```

---

Accord Project is an open source, non-profit, initiative working to transform contract management and contract automation by digitizing contracts.

## Contributing

Read our [contributing guide][contribute]. Find out what’s coming on our [blog][apblog].

## Getting Started

### Learn About Accord Project
* [Welcome][welcome]
* [Concepts and High-level Architecture][highlevel]
* [Ergo Language][ergolanguage]

### Try Accord Project
* [Using a Template with Cicero][usingcicero]
* [Authoring in Template Studio][authoring]

### Technical Reads
* [Ergo Compiler][ergocompiler]

### Blog
* [Accord Project News][apnews]

### Accord Project Codebase
* [Cicero][cicero]
* [Ergo][ergo]
* [Cicero Template Library][CTL]
* [Models][models]

* [Template Studio][tsv2]
* [Cicero UI][ciceroui]
* [Concerto UI][concertoui]
* [Markdown Editor][mdeditor]

## Community

The Accord Project technology is being developed as open source. All the software packages are being actively maintained on GitHub and we encourage organizations and individuals to contribute requirements, documentation, issues, new templates, and code.

Join the Accord Project Technology Working Group [Slack channel][slack] to get involved!

## License <a name="license"></a>

Accord Project source code files are made available under the [Apache License, Version 2.0][apache].

Accord Project documentation files are made available under the [Creative Commons Attribution 4.0 International License][creativecommons] (CC-BY-4.0).

## Not Legal Advice

The materials on this site are for informational purposes only and do not constitute legal advice. The Accord Project is not a law firm or a substitute for an attorney or law firm. The Accord Project cannot provide any kind of advice, explanation, opinion, or recommendation about possible legal rights, remedies, defenses, options, selection of forms, or strategies. The information provided is not intended to create, and receipt or use of it does not constitute, a lawyer-client relationship. Users should not act upon this information without seeking professional counsel.

[techspec]: https://docs.google.com/document/d/1UacA_r2KGcBA2D4voDgGE8jqid-Uh4Dt09AE-shBKR0
[aphome]: https://accordproject.org
[ctlguide]: https://docs.accordproject.org/docs/cicero-tutorial.html#creating-a-new-template

[contribute]: https://github.com/accordproject/cicero-template-library/blob/master/CONTRIBUTING.md
[apblog]: https://medium.com/@accordhq

[welcome]: https://docs.accordproject.org/docs/accordproject.html#what-is-accord-project
[highlevel]: https://docs.accordproject.org/docs/spec-concepts.html
[ergolanguage]: https://docs.accordproject.org/docs/logic-ergo.html

[usingcicero]: https://docs.accordproject.org/docs/basic-use.html
[authoring]: https://docs.accordproject.org/docs/advanced-latedelivery.html

[ergocompiler]: https://docs.accordproject.org/docs/ref-logic-specification.html

[apnews]: https://www.accordproject.org/news/
[cicero]: https://github.com/accordproject/cicero
[ergo]: https://github.com/accordproject/ergo
[CTL]: https://github.com/accordproject/cicero-template-library
[models]: https://github.com/accordproject/models

[tsv2]: https://github.com/accordproject/template-studio-v2
[ciceroui]: https://github.com/accordproject/cicero-ui
[concertoui]: https://github.com/accordproject/concerto-ui
[mdeditor]: https://github.com/accordproject/markdown-editor

[slack]: https://accord-project-slack-signup.herokuapp.com
[apache]: https://github.com/accordproject/cicero-template-library/blob/master/LICENSE
[creativecommons]: http://creativecommons.org/licenses/by/4.0/
