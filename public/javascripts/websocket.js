
var socket = io.connect("https://app-ggd94.c9users.io",{secure:true});

setInterval(function() {
    socket.emit("welcome",{rb:rb,array_notifiche:JSON.stringify(array_notifiche)});
    console.log("time");
}, 20000);

socket.on(rb,function(msg){
    console.log('pre push');
    console.log(msg);
    array_notifiche.push(msg);
    console.log(''+array_notifiche);
    $(".badge1").attr("data-badge",''+(parseInt($(".badge1").attr("data-badge"))+1));
    notification(msg);
})