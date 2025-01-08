# Ian's Website

This is the source code to my website (I'm Ian).

You can build the site for production with `mise run build`, the result will be placed in `_site`.
If you'd like to develop the site, run `mise run serve`.

## Tools

This is an [11ty](https://www.11ty.dev/)-based static site.
We use [mise-en-place](https://mise.jdx.dev) to manage tool versions and as a task runner.
By default, our _mise_ tasks use [Deno](https://deno.land) as the JavaScript runtime for [11ty](https://www.11ty.dev/), although `npx` or just plain `node` would work just as well.

We use [Vale](https://vale.sh) as a general-purpose linter.
Use `mise lint` to lint the `www/` directory.

### Quick Commands

First, make sure to install mise: [mise-en-place](https://mise.jdx.dev)

- **Install All Tools** `$ mise install`
- **Build The Site for Production** `$ mise build`, (output in `_site`)
- **Run a Development Server** `$ mise serve`
- **Run the Linter** `$ mise lint`
