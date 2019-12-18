// let {token, username} = localStorage
// $('#token').text(token)
// $('#username').text(username)
let socket

$('#signInAsGuest').click(async () => {
  // if (!token) {
  const {token: singInToken, username} = await $.ajax({
    url: target + "/user/signInAsGuest",
    type: 'post',
    dataType: 'json',
  })
  // localStorage.setItem("token", singInToken)
  // localStorage.setItem("username", username)
  token = singInToken
  $('#token').text(token)
  $('#username').text(username)
  // }
})

$('#connectSocket').click(async () => {
  socketManager(token)
})

$('#clearToken').click(() => {
  localStorage.clear()
})

$('#binary').click(async () => {
  const byets = await $.ajax({
    url: target + "/user/testFlatBuffer",
    type: 'get',
  })
  const buf = new flatbuffersLib.ByteBuffer(byets);
  const ReposList = window.ReposList.getRootAsReposList(buf);
  console.log(ReposList.name())
})
