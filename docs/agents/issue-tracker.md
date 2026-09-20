# Issue tracker: GitHub

Issues and specs for this repository live as GitHub Issues in `Lutvuk/provisioning-activation`.

Use the `gh` CLI for issue operations. Infer the repository from the configured Git remote.

Common operations:

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open --json number,title,body,labels,comments`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Pull requests are not treated as a separate triage request surface for this repository.
