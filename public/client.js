$(document).ready(function() {
  /*global io*/
  let socket = io();

  socket.on("user", function(data) {
    $("#num-users").text(data.currentUsers + " users online");
    var message = data.name;
    if (data.connected) {
      message += " has joined the chat.";
    } else {
      message += " has left the chat.";
    }
    $("#messages").append($("<li>").html("<b>" + message + "</b>"));
  });

  $("form").submit(function(e) {
    e.preventDefault(); // prevents page reloading
    let messageToSend = $("#m").val();
    socket.emit("chat message", messageToSend);
    $("#m").val("");
    return false;
  });

  socket.on("chat message", function(data) {
    $("#messages").append($("<li>").text(data.name + " , " + data.message));
  });
});
