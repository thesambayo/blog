---
title: "JavaScript: Pass-by-value, Pass-by-reference"
author: Samuel Adebayo
pubDatetime: 2023-12-20T16:48:30.000+01:00
slug: javascript-pass-by-value-pass-by-reference
featured: false
draft: false
tags:
  - javascript
  - JS
  - pass-by-value
  - pass-by-reference
description: Pass by value, Pass by reference; How arguments are received in JavaScript functions.
---

> This article is still under construction, hence not complete.

<!-- ## Introduction -->

When a function is called, arguments can be passed into the function is two ways, either **Pass-by-value** or **Pass-by-reference**.
The manner in which a argument are passed into functions are determined by its data type. [Primitive data types](https://developer.mozilla.org/en-US/docs/Glossary/Primitive) such as `boolean`, `number`, `null`, `string` and `undefined` are passed by value while [Non-primtive data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#objects) such as `arrays`, `functions` and `objects` are passed by reference.

<!-- ## Quick example -->

Before we go into what **Pass-by-value** or **Pass-by-reference** means, let's look at quick litmus test to see how JavaScript data types behave. You can try the following in right in your browser's console.

```js
// a primitive data type
let myName = "Samuel";

function changeNameValue(nameToChange) {
  console.log(nameToChange); // name is  Samuel
  nameToChange = "Peters";
  console.log(nameToChange); // name is  Peters
}

changeNameValue(myName);
console.log(name); // name is still Samuel
```

The above shows when passing a primitive data type as an argument into a function, the `value` of that primitive data is passed into the function. Changes to the value does not change the primitve data. Now let's look at non-primitive dats

```js
// a non-primitive data type
let myCourses = ["Chemistry", "Physics"];

function addNewCourse(coursesList) {
  console.log(coursesList); // ["Chemistry", "Physics"]
  coursesList.push("Mathematics");
  console.log(coursesList); // ["Chemistry", "Physics", Mathematics]
}

addNewCourse(myCourses);
console.log(myCourses); // ["Chemistry", "Physics", Mathematics]
```

Modifying the value of an array into a function causes changes to the array itself. How does this happen?
To really understand this, we need to understand how the JavaScript engine store data.

JavaScript engines have two places to store data:

- **Stack:** It is a data structure used to store static data. Static data refers to data whose size is known by the engine during compile time. In JavaScript, static data includes **_primitive values_** like `string`, `number`, `boolean`, `null`, and `undefined`. **_References_** that point to objects and functions are also included. A fixed amount of memory is allocated for static data. This process is known as static memory allocation.
- **Heap:** It is used to store objects and functions in JavaScript. The engine doesn’t allocate a fixed amount of memory. Instead, it allocates more space as required.

![JavaScript memory management](https://d2mk45aasx86xg.cloudfront.net/javascript_memory_management_85c00b32a6.webp)
