let task = "";
let id = 0;
let target = "";
$("#task").val("");
$("#box_task").hide();
$(".masseg").hide();

$("#btn_add").on('click',function(){
    if ($("#task").val()){

        $(".masseg").fadeIn(600,function(){
            $(".masseg").show();
        });
        $(".masseg").fadeOut(1500,function(){
            $(".masseg").hide();
        });
        task = $("#task").val();
        ++id;
        target = "<p>Задание № "+ id + ": " +task+"</p>";
        $(target).insertBefore(".tasks");
        $("#task").val("");
    }else{
        $("#task").val("Поле не должно быить пустым");
        $("#task").css("color", "red")

    }
});
$("#task").focus(function (e) { 
    e.preventDefault();
    $("#task").val("");
    $("#task").css("color", "#7f7f7f");
});
$("#btn_set").on("click", function () {
    $("#box_task").show();
    $("#box_task").val();
});