# Contributing to Cicero Template Library

> Thanks to the angularJS team for the bulk of this text!

We'd love for you to contribute to a template to make the Accord Project template library even better than it is today! Here are the guidelines we'd like you to follow:

* [Code of Conduct](#coc)
* [Questions and Problems](#question)
* [Issues and Bugs](#issue)
* [Feature Requests](#feature)
* [Improving Documentation](#docs)
* [Issue Submission Guidelines](#submit)
* [Pull Request Submission Guidelines](#submit-pr)

## <a name="coc"></a> Code of Conduct

Help us keep the Accord Project open and inclusive. Please read and follow our [Code of Conduct][coc].

## <a name="requests"></a> Questions, Bugs, Features

### <a name="question"></a> Got a Question or Problem?

Do not open issues for general support questions as we want to keep GitHub issues for bug reports
and feature requests. You've got much better chances of getting your question answered on dedicated
support platforms, the best being [Stack Overflow][stackoverflow].

Stack Overflow is a much better place to ask questions since:

- there are thousands of people willing to help on Stack Overflow
- questions and answers stay available for public viewing so your question / answer might help
  someone else
- Stack Overflow's voting system assures that the best answers are prominently visible.

To save your and our time, we will systematically close all issues that are requests for general
support and redirect people to the section you are reading right now.

Other channels for support are:
- the [Cicero Slack Channel][slack]

### <a name="issue"></a> Found an Issue or Bug?

If you find a bug in the documentation, you can help us by submitting an issue to our
[GitHub Repository][github]. Even better, you can submit a Pull Request with a fix.

**Please see the [Submission Guidelines](#submit) below.**

### <a name="feature"></a> Missing a Feature?

You can request a new feature by submitting an issue to our [GitHub Repository][github-issues].

If you would like to implement a new feature then consider what kind of change it is:

* **Major Changes** that you wish to contribute to the project should be discussed first in an
  [GitHub issue][github-issues] that clearly outlines the changes and benefits of the feature.
* **Small Changes** can directly be crafted and submitted to the [GitHub Repository][github]
  as a Pull Request. See the section about [Pull Request Submission Guidelines](#submit-pr), and
  for detailed information the [core development documentation][developers].

### <a name="docs"></a> Want a Doc Fix?

Should you have a suggestion for the documentation, you can open an issue and outline the problem
or improvement you have - however, creating the doc fix yourself is much better!

If you want to help improve the docs, it's a good idea to let others know what you're working on to
minimize duplication of effort. Create a new issue (or comment on a related existing one) to let
others know what you're working on.

If you're making a small change (typo, phrasing) don't worry about filing an issue first. Use the
friendly blue "Improve this doc" button at the top right of the doc page to fork the repository
in-place and make a quick change on the fly. The commit message is preformatted to the right type
and scope, so you only have to add the description.

For large fixes, please build and test the documentation before submitting the PR to be sure you
haven't accidentally introduced any layout or formatting issues. You should also make sure that your
commit message follows the **[Commit Message Guidelines][developers.commits]**.

## <a name="submit"></a> Issue Submission Guidelines
Before you submit your issue search the archive, maybe your question was already answered.

If your issue appears to be a bug, and hasn't been reported, open a new issue. Help us to maximize
the effort we can spend fixing issues and adding new features, by not reporting duplicate issues.

The "[new issue][github-new-issue]" form contains a number of prompts that you should fill out to
make it easier to understand and categorize the issue.

**If you get help, help others. Good karma rulez!**

## <a name="submit-pr"></a> Pull Request Submission Guidelines
Before you submit your pull request consider the following guidelines:

* Search [GitHub][pulls] for an open or closed Pull Request
  that relates to your submission. You don't want to duplicate effort.
* Create the [development environment][developers.setup]
* Make your changes in a new git branch:

    ```shell
    git checkout -b my-fix-branch master
    ```

* Create your patch commit, **including appropriate test cases**.
* Follow our [Coding Rules][developers.rules].
* Ensure you provide a DCO sign-off for your commits using the -s option of git commit. For more information see https://github.com/probot/dco#how-it-works
* If the changes affect public APIs, change or add relevant [documentation][developers.documentation].
* Run the [unit][developers.tests-unit] and [E2E test][developers.tests-e2e] suites, and ensure that all tests
  pass.
* Commit your changes using a descriptive commit message that follows our
  [commit message conventions][developers.commits]. Adherence to the
  [commit message conventions][developers.commits] is required, because release notes are
  automatically generated from these messages.

    ```shell
    git commit -s -a
    ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files. The `-s` command line option signs your commit using your GitHub registered email address. We require all commits to be signed.

* Before creating the Pull Request, package and run all tests a last time:

    ```shell
    lerna run test
    ```

* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request to `cicero:master`. This will trigger the check of the
[Developer Certificate of Origin](https://github.com/probot/dco#how-it-works) and the Travis integration.

* If you find that the Travis integration has failed, look into the logs on Travis to find out
if your changes caused test failures, the commit message was malformed etc. If you find that the
tests failed or times out for unrelated reasons, you can ping a team member so that the build can be
restarted.

* If we suggest changes, then:

  * Make the required updates.
  * Re-run the test suite to ensure tests are still passing.
  * Commit your changes to your branch (e.g. `my-fix-branch`).
  * Push the changes to your GitHub repository (this will update your Pull Request).

    You can also amend the initial commits and force push them to the branch.

    ```shell
    git rebase master -i
    git push origin my-fix-branch -f
    ```

    This is generally easier to follow, but seperate commits are useful if the Pull Request contains
    iterations that might be interesting to see side-by-side.

That's it! Thank you for your contribution!

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes
from the main (upstream) repository:

* Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

    ```shell
    git push origin --delete my-fix-branch
    ```

* Check out the master branch:

    ```shell
    git checkout master -f
    ```

* Delete the local branch:

    ```shell
    git branch -D my-fix-branch
    ```

* Update your master with the latest upstream version:

    ```shell
    git pull --ff upstream master
    ```

[coc]: https://github.com/accordproject/docs/blob/master/Accord%20Project%20Code%20of%20Conduct.pdf
[dco]: https://developercertificate.org/
[developers]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md
[developers.commits]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#commits
[developers.documentation]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#documentation
[developers.rules]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#rules
[developers.setup]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#setup
[developers.tests-e2e]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#e2e-tests
[developers.tests-unit]: https://github.com/accordproject/cicero/blob/master/DEVELOPERS.md#unit-tests
[github-issues]: https://github.com/accordproject/cicero-template-library/issues
[github-new-issue]: https://github.com/accordproject/cicero-template-library/issues/new
[github]: https://github.com/accordproject/cicero-template-library/techdocs
[stackoverflow]: http://stackoverflow.com/questions/tagged/cicero
[pulls]: https://github.com/accordproject/cicero-template-library/pulls

## License <a name="license"></a>
Accord Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Accord Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
