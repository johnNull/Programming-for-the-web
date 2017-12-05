<!DOCTYPE html>
<html>
  <head>
    <title>Login Page</title>
  </head>
  <body>
    <h1>Login Page</h1>
    <p class="error">{{msg}}</p>
    <form method="GET" action="/login">
      <label>
        <span class="label">User email</span>
        <input name="q" class="control" value="{{q}}"><br>
        <span class="label">Password</span>
        <input type ='password' name = "p" class="control"></input>
        {{#qError}}<span class="error">{{qError}}<br></span>{{/qError}}
      </label>
      <input name="submit" type="submit" value="login" class="control">
    </form>
    <a href='/register'> Register </a>
  </body>
</html>
