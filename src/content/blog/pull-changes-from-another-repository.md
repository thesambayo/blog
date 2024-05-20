---
title: "Pull changes from another remote repository"
author: Samuel Adebayo
pubDatetime: 2024-01-08T06:55:12.000+01:00
slug: pull-changes-from-another-repository
featured: false
draft: true
tags:
  - git
description: "Pull changes or updates from another Git remote repository"
---

> This article is still under construction, hence not complete.

## Table of contents

## Without adding a new origin

You can git pull directly from another repo without adding a new origin. This pull changes directly from the `mentioned` branch into your current `checkedout` branch.

```bash
git pull {git-url} {branch}
```

Assuming a pull from another repo's `main` branch to the local `main` branch or a local branch (exisiting or new).

```bash
git pull {git-url} main:main

# OR pull to a new local branch
git pull {git-url} main:new_local_branch
```

If the commit histories of the two repos are not linked then you will need to add `--allow-unrelated-histories` but use it with caution, as it implies you know what you are doing.

```bash
git pull {git-url} {branch} --allow-unrelated-histories
```

## Adding a new origin
