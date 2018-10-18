# nath-utils

## Branching strategy

- New branches should not be created from `master` branch.
- For new sub-project branch, fork `projectscommon` branch.
  - The new branch should be named with full lowercase and digits, understandable name like `newutiltool`.

- For sub-project feature or temporary branch, fork the corresponding sub-project branch.
  - Name feature branches starting with sub-project name then a dash, then any description in lowercase: `newutiltool/feature42`

- All branches should regularly pull changes made on `projectscommon` branch.
- All branches will regularly been merged to `master` branch.

- Do not remove either `master` or `projectscommon` branches.
- No change or rebase to `master` branch is allowed. Use pull requests and merge only !
