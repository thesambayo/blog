---
title: "Golang: Pass-by-value, Pass-by-reference"
author: Samuel Adebayo
pubDatetime: 2024-01-01T06:55:12.000+01:00
slug: golang-pass-by-value-pass-by-reference
featured: false
draft: true
tags:
  - golang
  - pass-by-value
  - pass-by-reference
description: "How arguments are received and updated in Golang functions."
---

> Disclaimer: There is no pass by reference in Golang

When a function is called, arguments can be passed into the function is two ways, either **Pass-by-value** or **Pass-by-reference**.
The manner in which a argument are passed into functions are determined by its data type. [Primitive data types](https://developer.mozilla.org/en-US/docs/Glossary/Primitive) such as `boolean`, `number`, `null`, `string` and `undefined` are passed by value while [Non-primtive data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#objects) such as `arrays`, `functions` and `objects` are passed by reference.

Before we go into what **Pass-by-value** or **Pass-by-reference** means, let's look at quick litmus test to see how JavaScript data types behave. You can try the following in right in your browser's console.

```go
package main

import fmt

func changeNameValue(nameToChange string) {
	fmt.Println(nameToChange) // name is  Samuel
	nameToChange = "Peters"
	fmt.Println(nameToChange) // name is  Peters
}

func main() {
	// a primitive data type
	myName := "Samuel"
	changeNameValue(myName)
	fmt.Println(name) // name is still Samuel
}
```

The above shows when passing a primitive data type as an argument into a function, the `value` of that primitive data is passed into the function. Changes to the value does not change the primitve data. Now let's look at non-primitive data

```go
package main

import fmt

func addNewCourse(coursesList []string) {
	fmt.Println(coursesList) // name is  Samuel
	coursesList = append(coursesList, "Mathematics")
	fmt.Println(coursesList) // name is  Peters
}

func main() {
	let myCourses := []string{"Chemistry", "Physics"}
	addNewCourse(myCourses)
	fmt.Println(myCourses) // name is still Samuel
}
```
