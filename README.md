<p align="center">
  <a href="https://www.accordproject.org/">
    <img src="assets/images/APLogo.png" alt="Accord Project Logo" width="400" />
  </a>
</p>

<h1 align="center">
  Accord Project Template Library
</h1>

<p align="center">
  <a href="https://travis-ci.org/accordproject/cicero-template-library">
    <img src="https://travis-ci.org/accordproject/cicero-template-library.svg" alt="Build Status"/>
  </a>
  <a href="https://github.com/accordproject/cicero-template-library/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/accordproject/cicero-template-library" alt="GitHub license"/>
  </a>
  <a href="https://www.accordproject.org/">
    <img src="https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg" alt="Accord Project" />
  </a>
</p>

Repository for Smart Legal Contract Templates that conform that to the [Accord Project Template Specification][techspec], the protocol is managed by the open-source community of the [Accord Project][aphome]. 

These templates can be parsed and executed by the [Cicero][cicero] engine.

## Library

The contents of this repository is automatically tested, built and published to the 
Accord Project Template Library, hosted at https://templates.accordproject.org.

## Contributing

Can't find something? Then why not make a new template yourself? 

[Follow the instructions in the docs.][ctlguide]

## Testing

To install and test all the templates locally, clone this repository and use lerna:
```
npm install -g lerna@^3.15.0
lerna bootstrap
lerna run test
```

## Building Static Pages

To generate the static HTML pages for each template, run:
```
npm run build
```

By default, old pages will include links to newer versions of templates, to skip regeneration of old pages with the latest set of links, run:
```
SKIP_DROPDOWNS=true npm run build
```

## Previewing Static Files locally

After building the static pages, install the Netlify CLI with 
```
npm install netlify-cli -g
```

Then run
```
netlify dev -d build
```

---

<p align="center">
  <a href="https://www.accordproject.org/">
    <img src="assets/images/APLogo.png" alt="Accord Project Logo" width="400" />
  </a>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/accordproject/cicero?color=bright-green" alt="GitHub license">
  </a>
  <a href="https://discord.gg/Zm99SKhhtA">
    <img src="https://img.shields.io/badge/Accord%20Project-Join%20Discord-blue" alt="Join the Accord Project Discord"/>
  </a>
</p>

Accord Project is an open source, non-profit, initiative working to transform contract management and contract automation by digitizing contracts. Accord Project operates under the umbrella of the [Linux Foundation][linuxfound]. The technical charter for the Accord Project can be found [here][charter].

## Learn More About Accord Project

### [Overview][apmain]

### [Documentation][apdoc]

## Contributing

The Accord Project technology is being developed as open source. All the software packages are being actively maintained on GitHub and we encourage organizations and individuals to contribute requirements, documentation, issues, new templates, and code.

Find out what’s coming on our [blog][apblog].

Join the Accord Project Technology Working Group [Discord channel][apdiscord] to get involved!

For code contributions, read our [CONTRIBUTING guide][contributing] and information for [DEVELOPERS][developers].

### README Badge

Using Accord Project? Add a README badge to let everyone know: [![accord project](https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg)](https://www.accordproject.org/)

```
[![accord project](https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg)](https://www.accordproject.org/)
```

## License <a name="license"></a>

Accord Project source code files are made available under the [Apache License, Version 2.0][apache].
Accord Project documentation files are made available under the [Creative Commons Attribution 4.0 International License][creativecommons] (CC-BY-4.0).

Copyright 2018-2019 Clause, Inc. All trademarks are the property of their respective owners. See [LF Projects Trademark Policy](https://lfprojects.org/policies/trademark-policy/).

[linuxfound]: https://www.linuxfoundation.org
[charter]: https://github.com/accordproject/governance/blob/master/accord-project-technical-charter.md
[apmain]: https://accordproject.org/ 
[apblog]: https://medium.com/@accordhq
[apdoc]: https://docs.accordproject.org/
[apdiscord]: https://discord.gg/Zm99SKhhtA

[contributing]: https://github.com/accordproject/cicero-template-library/blob/master/CONTRIBUTING.md
[developers]: https://github.com/accordproject/cicero-template-library/blob/master/DEVELOPERS.md

[apache]: https://github.com/accordproject/cicero-template-library/blob/master/LICENSE
[creativecommons]: http://creativecommons.org/licenses/by/4.0/

[techspec]: https://docs.accordproject.org/docs/accordproject-template.html
[aphome]: https://accordproject.org
[cicero]: https://github.com/accordproject/cicero
[ctlguide]: https://docs.accordproject.org/docs/started-installation.html