<!DOCTYPE html>
<html>
  <head>
    <title>Registration Page</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>Register</h1>
    <p class="error">{{msg}}</p>
    <form method="GET" action="/register">
      <label>
        <span class="label">First name</span>
        <input name="fn" class="control" value="{{fn}}"><br>
        <span class="label">Last name</span>
        <input name="ln" class="control" value="{{ln}}"><br>
        <span class="label">User email</span>
        <input name="q" class="control" value="{{q}}"><br>
        <span class="label">Password</span>
        <input type ='password' name = "p" class="control"></input>
        <span class="label">Confirm password</span>
        <input type ='password' name = "p2" class="control"></input>
        {{#qError}}<span class="error">{{qError}}<br></span>{{/qError}}
      </label>
      <input name="submit" type="submit" value="Register" class="control">
      <a href="/login"> Login Page </a>
    </form>
  </body>
</html>
