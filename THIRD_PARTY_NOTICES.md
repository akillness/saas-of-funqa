# Third-party notices

FunQA ships third-party code in its browser bundle. The MIT license permits use,
modification, redistribution, sublicensing, and commercial sale, but its one
condition is real: the copyright notice and permission notice must travel with
copies or substantial portions of the software. Minifiers do not preserve a
license comment that was never in the distributed JavaScript, so the notice lives
here rather than depending on the bundler.

This file covers dependencies that are compiled into a distributed artifact. It
is an engineering record, not legal advice.

---

## UI motion renderers

Both packages are pinned to exact versions. The pins are the npm `latest`
releases at the time of the source audit recorded in
[`docs/ui-motion-capability-contract.md`](docs/ui-motion-capability-contract.md),
not floating ranges, so the audited source and the shipped tarball stay the same
artifact.

### `border-beam` 1.3.0

- Author: Jakub Antalik
- Repository: https://github.com/Jakubantalik/Libraries
- Package: https://www.npmjs.com/package/border-beam/v/1.3.0
- Audited source: `Jakubantalik/Libraries` @ `b47ff34dbb37c6fb801cbfc195ec840c8b1924b2`
- License: MIT

### `thinking-orbs` 0.3.1

- Author: Jakub Antalik (Thinking Orbs demo site credits Alex Brinza)
- Repository: https://github.com/Jakubantalik/thinking-orbs
- Package: https://www.npmjs.com/package/thinking-orbs/v/0.3.1
- Audited source: `Jakubantalik/thinking-orbs` @ `de85557ca220332586d070d8788c0e1d6e877a0d`
  (identical to the same package inside `Jakubantalik/Libraries` @ `b47ff34`)
- License: MIT

### License text

Both packages ship the same notice, reproduced from the `LICENSE` file inside
each published tarball:

```
MIT License

Copyright (c) 2026 Jakub Antalik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Maintaining this file

1. Any new dependency that reaches the browser bundle or a shipped server
   bundle gets an entry here before it is merged.
2. Record the exact version, the upstream repository, and the source coordinate
   the version was reviewed at. "Latest" is not a coordinate.
3. If a package is vendored or copied rather than installed, copy its notice
   verbatim next to the vendored files as well.
4. Removing a dependency removes its entry in the same commit.
