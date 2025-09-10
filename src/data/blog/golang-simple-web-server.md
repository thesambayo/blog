---
title: "Getting started with a simple web server in Go"
author: Samuel Adebayo
pubDatetime: 2024-04-06T16:32:20.000+01:00
modDatetime: 2024-05-06T16:32:20.000+01:00
slug: golang-simple-web-server
featured: false
draft: false
tags:
  - golang
  - web-server
description: "Creating a simple web server in Golang."
---

In this guide, we will walk through the process of creating a simple web server in Golang using only the standard library.

To create a web server in Golang, there are three essential components we need to get started:

- A router or request multiplexer (or `servemux` in Golang terminology) that routes incoming HTTP requests to the appropriate handler functions.
- A web server to listen to incoming requests.
- Handler functions that process incoming HTTP requests and send appropriate responses, errors, and/or headers.

## Setting up a router

The `servemux` stores a mapping between the URL patterns for your application and the corresponding handlers. Usually, you have one `servemux` for your application containing all your routes.
We use the `http.NewServeMux()` function to initialize a new servemux.

```go
package main

import (
	"net/http"
)

func main() {
	mux := http.NewServeMux()
}
```

## Establishing a web server

To create a web server, we use the `http.ListenAndServe()` function. This function takes two arguments:

1. The network address to listen on (in the form of `host:port` e.g `":8080"`).
2. The `servemux` to use to handle incoming requests.

The `http.ListenAndServe()` function returns a _non-nil_ error if the server fails to start. We can log this error and exit the program or handle as you please.

```go
package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal(err)
	}
}
```

> This server is not a server that reloads after file changes. You will need to stop and restart the server manually. To start the server, run `go run main.go` in the terminal.

## Handling requests with handler functions

Handler functions process incoming HTTP requests, executing your application logic and writing appropriate HTTP response bodies and headers.

In Golang, a handler function is any function that has the signature `func(http.ResponseWriter, *http.Request)`.

- The `http.ResponseWriter` is used to write the response back to the client.
- The `*http.Request` is a pointer to a struct that holds information about the incoming request like the URL, headers, and body.

`mux.HandleFunc()` is used to register a handler function for a specific URL path and request method. It takes two arguments:

1. The URL pattern to match.
2. The handler function to execute when the URL pattern is matched.

```go
package main

import (
	"log"
	"net/http"
)

func main() {
	// router setup
	mux := http.NewServeMux()

	// handler function
	mux.HandleFunc(
		"GET /{$}", // URL pattern
		func(resWriter http.ResponseWriter, request *http.Request) { // handler function
			resWriter.Write([]byte("Hello, World!"))
		}
	)

	// start the server
	err := http.ListenAndServe(":8080", mux)
	// handle error from server failure
	if err != nil {
		log.Fatal(err)
	}
}
```

### Important: Why "GET /{$}" in the URL Pattern for HandleFunc?

**Before the release of Go version `1.22`**, the Go’s `servemux` treated the URL pattern "/" as a catch-all (well, it still does).

This means that if you register a handler function with the URL pattern "/", it will match all incoming requests, regardless of their URL path and Method.
So at the moment all HTTP requests to the web server will be handled by the home function, regardless of their URL path.

```go
// ...package main and imports

func main() {
	mux := http.NewServeMux()

	// catch-all handler function
	mux.HandleFunc("/", home)

	// ... start server and handle error
}

func home(resWriter http.ResponseWriter, request *http.Request) {
	resWriter.Write([]byte("Hello, World!"))
}

```

For instance, you can visit a different URL paths like http://localhost:8080/ and http://localhost:8080/products (also try sending POST, GET, DELETE) and you will receive exactly the same response.

So to make sure the handler function only matches requests to the desired path, extra code is needed to check the request method and URL path.

```go
// ...package main and imports

func main() {
	mux := http.NewServeMux()

	// this handler function will match all incoming requests like
	// GET /foo, POST /foo, GET /bar,  PUT /bar, etc
	mux.HandleFunc("/", home)

	// ... start server and handle error
}

func home(resWriter http.ResponseWriter, request *http.Request) {
	// check if the request method is GET and the URL path is "/"
	if request.Method != http.MethodGet || request.URL.Path != "/" {
		http.Error(resWriter, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// do route work like get data from DB, process data, etc
	// then write response
	resWriter.Header().Add("Content-Type", "text/html; charset=utf-8")
	resWriter.Write([]byte("Hello, World!"))
}
```

[**After the release of Go version `1.22`**](https://tip.golang.org/doc/go1.22#enhanced_routing_patterns), we can perform better _pattern matching_ based on the request method (GET, POST, PUT, DELETE, etc) and the URL path for the handler function.

Hence, the URL pattern for the home handler function is now `GET /{$}`. This means the handler function will only match requests with the `GET method` and URL path `/`.

```go
// ...package main and imports

func main() {
	mux := http.NewServeMux()

	// this handler function will match only GET requests to the root URL path
	mux.HandleFunc("GET /{$}", home)

	// ... start server and handle error
}

func home(resWriter http.ResponseWriter, request *http.Request) {
	// no need for checks anymore

	// do route work like get data from DB, process data, etc
	// then write response
	resWriter.Header().Add("Content-Type", "text/html; charset=utf-8")
	resWriter.Write([]byte("Hello, World!"))
}
```

### Patterns for URL matching

#### 1. Exact Method

For exact method matching, you start the URL pattern with the method like `GET /`. This will match only the GET method and not POST, PUT, DELETE, etc.

So a URL pattern like `POST /` will match only the POST method and URL path `/` and not GET, PUT, DELETE, etc.

---

#### 2. Exact URL Path

For exact URL path matching, you end the URL with a `{$}` like `GET /{$}`. This will match only the URL path `/` with a GET method and not `/` with other methods, `/foo`, `/bar`, etc.

So a URL pattern like `GET /foo/{$}` will match only the URL path `/foo/` and not `/foo/2`, `/foo/bar`, `/foo/baz`, etc.
A URL pattern like `GET /foo` will match only the URL path `/foo`.

Not that `GET /foo` is quite different from `GET /foo/{$}` because of the ending `/`.

---

#### 3. Wildcards URL Path

There are two types of wildcard URL path matching:
`/products/{id}` and `/files/{filePath...}`

`/products/{id}` will match any URL path that starts with `/products/` and has a single path segment after `/products/`.
For example, `/products/1`, `/products/2`, `/products/3`, etc.
The segment after `/products/` is stored in the `id` variable and can be accessed in the handler function by calling `request.PathValue("id")`.

`/files/{filePath...}` will match any URL path that starts with `/files/` and has one or more path segments after `/files/`.
For example, `/files/foo`, `/files/foo/bar`, `/files/foo/bar/baz`, etc.

This is especially useful for serving static files.

```go
// ...package main and imports

func main() {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.Dir("./ui/static/"))
	mux.Handle("GET /static/{filePath...}", http.StripPrefix("/static", fileServer))
	// you can then access files in the ui/static directory like:
	// http://localhost:8080/static/css/style.css
	// <script src="/static/js/main.js" type="text/javascript"></script>

	// ... start server and handle error
}
```

---

Note: if two patterns overlap in the requests, the more specific pattern will take precedence.

> For live reloads, you can use a tool like [Air](https://github.com/air-verse/air#installation)

Happy coding!
