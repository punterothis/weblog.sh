# weblog.sh
__Blog from the Command Line — https://weblog.sh/__

[weblog.sh](https://weblog.sh) is a blogging platform boiled down to its core. The only features are to save a draft, and to publish it.

The post format is plain text<sup>1</sup>, use SCP to transfer posts. First line is the title.

It serves posts under your [~username](https://weblog.sh/~postmaster), which is the only thing it knows about you, aside from SSH key or password authentication.

The service aims to reduce the blogging workflow and presentation to its minimum, employing only core blogging features. Basically trying to get as close to "text files in a folder" but not leaving the "published online" domain. An antithesis to rich blogging platforms.

<small>1: [link format https://weblog.sh], this is the web after all</small>

---

**This project repository — weblog.sh — contains the source code for the site.**

### The Platform

The features are minimal. You get a home page, which shows an index of all your posts, and a page for each article. An Atom feed is also provided, articles are syndicated in full.

As for personalization, you have one setting, and only once - your username.

Users are anonymous, no information is explicitly requested other than the preferred username.

No password recovery system is in place, or ever will be. If an account is lost, or compromised, it is likely to stay that way forever.

The system is designed to have as little personally identifying information as possible (afaik IPs in logs), in the case of a leak data exposed will only slightly be meaningful than what's already publicly available on the platform.

Passwords are stored after a one-way encryption.

### The Source Code

The service runs on a custom SSH server, supporting the SCP protocol to let netrw users directly manipulate posts.

Other than that, it's mostly a basic Express web app.

## Contributing

- Take up any of the issues reported in [Github Issues](https://github.com/hmngwy/weblog.sh/issues)
  - Answer user questions, issues arising with usage
  - Or look into the detail, and maybe fix reported bugs
- Report bugs using [Github Issues](https://github.com/hmngwy/weblog.sh/issues)
  - Also welcome: suggestions, opinion, open discussions
- Support the project through [♥︎Gratipay](https://gratipay.com/weblog-sh/)

### TO-DO List

We are using [Issues](https://github.com/hmngwy/weblog.sh/issues) as a to-do list. Items are labeled according to their priority and which component they are for.

## Getting in touch
postmaster at weblog•sh

### LEGAL

GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

**weblog.sh - hosted blogging service managed through SSH and SCP**

Copyright (C) 2015 Conrado Patricio Ambrosio

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
