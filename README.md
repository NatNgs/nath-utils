# nath-utils

This Git project gather multiple mini-projects that are not big enouth to need a whold git project for them.

Projects can be: tools, demo, tests/POC, ...

## File and folder architecture

- Each sub-project should have exactly one folder at the root of nath-utils git.
  - Inside this folder, do whatever you want.
  - You may also redifine the sub-project own file and folder architecture, valid inside this sub-project source folder only.
- All files not in projects folders are initially built on `projectscommon` branch.
  - Projects can modify these files (`README.md`, `.gitignore`...) on their branches (changes can be merged to `master` branch but not on `projectscommon`)

## Branching strategy

- No branch should be forked from `master` branch.
- New sub-project branch should be forked from `projectscommon` branch.
  - Should be named with full lowercase and digits, like `newutiltool`.
- New sub-project feature or temporary branch should be forked from the corresponding sub-project branch.
  - Should be named starting with sub-project name, then a slash, then any description in lowercase: `newutiltool/feature42`


- All branches should regularly pull changes made on `projectscommon` branch.
- All branches will regularly been merged to `master` branch.


- Do not remove either `master` or `projectscommon` branches.
- No change or rebase to `master` branch is allowed. Use pull requests and merge only !
