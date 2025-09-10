---
title: "What is the linked list data structure?"
author: Samuel Adebayo
pubDatetime: 2024-02-12T14:55:12.000+01:00
slug: what-is-the-linked-lists-data-structure
featured: true
draft: false
tags:
  - data structures
description: "Linked list data structure, its properties and methods"
---

### Table of contents

## What is the linked list data structure?

A linked list is a data structure that stores a sequence of elements called nodes. Each `node` contains a `value` and can may include a `reference` to the next node and/or previous node in the sequence.

A linked list can be **singly** or **doubly** linked list.

<!--![intro to linked list](@assets/images/linkedlist/intro.png)-->
> Nodes are containers that contain a value of type T and a reference to another node.

A node can be represented as:
```go
// singly linked list
// where T is a generic type
type Node[T any] struct {
	value T
	next  *Node[T]
}
```

The first node is called `head` and the last node is called `tail`.
> Unlike an array, a linked list does not use **indexes** to access elements. Instead, you have access to nodes, and you must traverse the list sequentially to reach the value you need.

```go
// Doubly linked list:
type Node[T any] struct {
	value T
	next  *Node[T]
	prev *Node[T]
}
```
<!--![head and tail nodes](@assets/images/linkedlist/head-tail.png)-->

## Operations in linked list
For each operation, we will consider both singly and doubly linked lists. Some operations might seem straightforward, but the implementation can be tricky as you have to take into account the references to either the next node or the previous node.

### Retrieving values
To get a value from a linked list, we have to traverse the list to reach that value. If we want to get the value from the second node, we have to take two steps to reach the second node. This is true for both types of linked lists.
<!--![get-value-operation](@assets/images/linkedlist/get-value-operation.png)-->


### Inserting new values

Inserting a new value into a linked list can be broken down into two steps:
1. Traversing to the point of insertion - an O(n) operation
2. Performing the insertion process itself - our focus

Assuming we are at the point of insertion, we want to insert new node that contains a value `[H]` in between two nodes, let's say `[B]` and `[C]`.
we take `[B].next` (which is currently pointing to [C]) and point `[B].next` to `[H]`. And we take `[H].next` (which is currently nil/undefined) and point it to `[C]`.

If our linked list is a doubly linked list, we also have to update the `.prev`s of all participating nodes.
<!--![insertion-operation](@assets/images/linkedlist/insertion.png)-->


These actions with the `.next`s and `.prev`s are independent of the list size or size of the node or its value and thus is a **O(1) operation**.

### Deletion of values
<!--![deletion-operation](@assets/images/linkedlist/deletion.png)-->
