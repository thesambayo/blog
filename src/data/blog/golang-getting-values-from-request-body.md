---
title: "Parsing form data from requests in Go"
author: Samuel Adebayo
pubDatetime: 2024-03-14T21:23:23.000+01:00
slug: parse-form-data-in-golang
featured: false
draft: false
tags:
  - golang
description: "How to parse and retrieve form values from requests in Go."
---

We will learn how to process and use the form data when it’s submitted to a route in your Go web server. The `net/http` standard package will be used to handle both our routes and the form data. No libraries or frameworks are required.

> If you don't already, learn how to [create a simple web server in go](/posts/golang-simple-web-server).

## How do our form look like?

To get started, you can find an example form with a go web server at the repository [here, branch for beginning of article](https://github.com/thesambayo/golang-parse-form-data). Here is a picture reference for the form:

![Form](@/assets/images/form-parsing/form-reference.png)

We are collecting information for an event. The form has fields for the full name, event date, event type, details, and interest. The form is submitted to the `/create` route via a POST method `<form action="/create" method="POST">`.

> HTML form elements have the `name` attribute you can (and should) use to reference the fields for form data when the form is submitted to the server. For example, our form example have: `<input name="fullName" />`, `<select name="eventType">` e.t.c .

#### Names of form fields

- fullName - full name of the person
- eventDate - date of the event
- eventType - type of event
- details - details of the event
- interest - interest of the person

Before, we get started, here is a snippet of our handler function for the `/create` route:

```go
func createEvent(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte("Create event called"))
}
```

## Get values from form data

To parse a form data, we need to take two significant steps:

1. Parse the request body.
2. Retrieve the values from the parsed form data.

#### 1. Parse the request body

To parse the request body, we need to call a method on the request struct, `ParseForm()`.

- This method checks that the request body is well-formed and then stores the form data in the request's `req.PostForm` map (which we will use to retrieve the form values).
- If any errors are encountered during the parsing process, such as no body or a body that is too large to process, an error will be returned.
- It's important to note that the `req.ParseForm()` method is idempotent, meaning it can safely be called multiple times on the same request without any side effects.

Now, we will update our handler function to parse the form data:

```go
func createEvent(w http.ResponseWriter, req *http.Request) {
    err := req.ParseForm()
    if err != nil {
        http.Error(w, "Error parsing form data", http.StatusBadRequest)
        return
    }
    w.Write([]byte("Create event called"))
}
```

#### 2. Retrieve the values from the parsed form data

After parsing the form data, we can now retrieve the values from the `req.PostForm` map.

> The `PostForm` map contains the form values with the form field names as keys and the form field values as slices of strings.

To retrieve a specific form field value, you can use the `req.PostForm.Get(fieldName)` method. For example, to retrieve the value of the `fullName` field, you can use `req.PostForm.Get("fullName")`. If there is no matching field name in the form, this method will return an empty string `""`. This way, we can get the value for each form field values.

However, it works a bit different for fields like checkboxes. Fields that can have multiple values. Because the `req.PostForm` map actually is a map with a string as key and slices of string as values, this means a key can contain more than one value.

```go
req.PostForm: map[string][]string
```

The Get method on the PostForm `req.PostForm.Get(fieldName)` gets only the first value in the string slice for the field and if the field is not present returns an empty string. For fields with a single value like fullName (input text), `req.PostForm[fullName]` is actually a string slice with one value. For fields like checkboxes, it can contain multiple strings.

Hence, to retrieve the values for checkboxes, we use `req.PostForm["checkboxFieldName"]`.

Now, let's update our handler function to retrieve form values:

```go
// let's create a struct type for our form values
type NewEventRequest struct {
	fullName string
	eventDate string
	eventType string
	details string
	interest []string
}

func createEvent(w http.ResponseWriter, req *http.Request) {
    err := req.ParseForm()
    if err != nil {
        http.Error(w, "Error parsing form data", http.StatusBadRequest)
        return
    }

	newEventRequest := NewEventRequest{
		fullName: req.PostForm.Get("fullName"),
		eventDate: req.PostForm.Get("eventDate"),
		eventType: req.PostForm.Get("eventType"),
		details: req.PostForm.Get("details"),
		interest: req.PostForm["interest"],
	}

  w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(newEventRequest.fullName + " event has been created"))
}
```

---

#### Expecting other form value types aside from string

The req.PostForm.Get() method always returns the form data as a `string`.
Whenever you are expecting a field value to be a `number`, and want to represent it in your Go code as an integer, you need to manually convert the form data to an integer using `strconv.Atoi()`, and send a **_400 Bad Request response_** if the conversion fails.

Here's an example of how to use `strconv.Atoi()`:

```go
durationStr := req.PostForm.Get("duration")
duration, err := strconv.Atoi(durationStr)
if err != nil {
    http.Error(w, "Invalid duration value", http.StatusBadRequest)
    return
}
```

---

#### The `req.Form` map

There is an alternative way to access form values besides using `req.PostForm`. This method is `req.Form`.

The `req.Form` map includes the form data from any **_request body_** as well as any **_query string_** parameters. Therefore, if our form was submitted to **_/create?orgId=mandem_**, we could retrieve the value of the orgId parameter by calling `req.Form.Get("orgId")`.

Keep in mind that if there is a conflict (if a key exists in both form data and query params), the value from the request body will take precedence over the query string parameter.

> request body >>> query params

Utilizing the `req.Form` map can be beneficial if your application transmits data both in an HTML form and through the URL, or if your application does not differentiate between how parameters are passed.

> The `req.PostForm` is populated for only **POST**, **PATCH** and **PUT** requests. Meanwhile, irrespective of their **HTTP method**, the `req.Form` is populated for all requests.

## Conclusion

In this article, we learned how to parse and retrieve form values from requests in Go. We learned how to parse the request body and retrieve the form values from the parsed form data. We also learned how to handle different types of form fields and how to handle form values that are not strings.

We also learned about the `req.Form` map and how it can be used to access form values and query string parameters.

> Branch for complete code: [here](https://github.com/thesambayo/golang-parse-form-data/tree/parse-form-values)

Happy coding!
