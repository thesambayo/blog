---
title: "Golang: Getting values from request body"
author: Samuel Adebayo
pubDatetime: 2024-01-01T06:55:12.000+01:00
slug: golang-getting-values-from-request-body
featured: false
draft: true
tags:
  - golang
  - go
description: "How to retrieve form values from request body"
---

Getting values from request body in Golang


Consider the mini application setup:

```go
package main

import (
	"net/http"
)

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("POST /posts", createPost)
    // correct this: err := server.ListenAndServe()
    // blahblah
}

func createPost() http.HandlerFunc {
    return func(responseWriter http.ResponseWriter, request *http.Request) {
        // first parse the request bodies by calling parseform
        // this works for only post, patch and put requeests
        // returns error which can be handled to a 400 bad request response back to users
        err := request.ParseForm()
        // handle error

        // then you can use request.PostForm.Get("title")... to retrieve data from the form map
        // the Get method always returns a string, so you will have to do a manaul type conversion to get the value into other types


    }
}
```

There are methods such as  request.FormValue() and .PostFormValue(). They are shortcuts that calls ParseForm() and retrieve values for you, but they silently ignore any errors returned by ParseForm(). Not ideal and definitely not recommended.

For UI form fields with multiple values such as checkboxes;
```html
<input type="checkbox" name="items" value="foo"> Foo
<input type="checkbox" name="items" value="bar"> Bar
<input type="checkbox" name="items" value="baz"> Baz
```

Using request.PostForm.Get() will return only the first value for the field (which it does for other fields tbh, but those fields only contain one value).
So will we use request.PostForm[‘items’] which will give us a []string slice.

```go
for i, item := range r.PostForm["items"] {
    fmt.Fprintf(w, "%d: Item %s\n", i, item)
} 
```