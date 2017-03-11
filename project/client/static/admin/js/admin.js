(function() {
  var api_base, delay;
  var bootbox = window.bootbox,
      $ = window.jQuery;

  delay = function(ms, fn) {
    return setTimeout(fn, ms);
  };

  api_base = '/api/v2';

  // 验证码
  $('.acquire-verify-code').on('click', function() {
    var $btn, calling_code, line_number;
    $btn = $(this);
    calling_code = $('[name=calling_code]').val();
    line_number = $('[name=line_number]').val();
    console.log(calling_code, line_number);
    if (calling_code && line_number) {
      $btn.prop('disabled', true);
      return $.ajax("" + api_base + "/sendVerificationCode", {
        type: 'POST',
        data: JSON.stringify({
          calling_code: calling_code,
          line_number: line_number
        }),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        statusCode: {
          200: function() {
            var countdown;
            $('.acquire-verify-code').hide();
            $('.re-acquire-verify-code').removeClass('hidden');
            countdown = function() {
              var num;
              num = parseInt($('.re-acquire-verify-code .countdown').text());
              if (num === 0) {
                $('.acquire-verify-code').show();
                $('.re-acquire-verify-code').addClass('hidden');
                return $('.re-acquire-verify-code .countdown').text('60');
              } else {
                $('.re-acquire-verify-code .countdown').text(num - 1);
                return delay(1000, countdown);
              }
            };
            return delay(1000, countdown);
          },
          400: function(xhr) {
            alert(xhr.responseJSON.meta.error_message);
            return $('input[name=mobile]').focus();
          }
        },
        complete: $btn.prop('disabled', false)
      });
    } else {
      return $('input[name=mobile]').focus();
    }
  });

  var manage_waitinglist = function(btn, action) {
    var $btn = $(btn);
    var $broadcast = $(btn).closest('.broadcast');
    var broadcast_id = $broadcast.data('id');
    var text = "确定" + $btn.text() + "“" + $broadcast.data('title') + "”？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        $.post('/adm2/review/waitinglist/manage/' + action + '/' + broadcast_id, function(resp) {
            $broadcast.fadeOut(function() { $(this).remove(); });
        });
        }
        });
  };

  $('ul.broadcasts').on('click', '.add_blacklist', function() { manage_waitinglist(this, 'black'); });
  $('ul.broadcasts').on('click', '.add_whitelist', function() { manage_waitinglist(this, 'white'); });
  $('ul.broadcasts').on('click', '.add_waitinglist', function() { manage_waitinglist(this, 'waiting'); });

  // 直播管理
  var manage_broadcast = function(btn, action) {
    // 最热／最新／已雪藏
    var $btn = $(btn);
    var $broadcast = $(btn).closest('.broadcast');
    var broadcast_id = $broadcast.data('id');
    var text = "确定" + $btn.text() + "“" + $broadcast.data('title') + "”？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        if (!broadcast_id){
          alter('操作出问题了,请刷新界面重新操作!')
          return;
        }
        $.post('/adm2/review/broadcast/manage/' + action + '/' + broadcast_id, function(resp) {
          if (resp['blacklist'] && resp['stop']){
             alert('主播已经被封号和停播');
          }
          else if (resp['stop'] && action != 'blacklist'){
             alert('主播已经停播');
          }else{
            if (action === 'hide'){
              $broadcast.addClass('is-hidden');
              $broadcast.find('.hide-broadcast').hide()
              $broadcast.find('.unhide-broadcast').show()
            }
            if (action === 'unhide'){
              $broadcast.removeClass('is-hidden');
              $broadcast.find('.unhide-broadcast').hide()
              $broadcast.find('.hide-broadcast').show()
            }
          }
          var will_stop = action === 'stop' || action === 'blacklist';
          if (will_stop) {
              $('#iframe-play-broadcast').hide();
              $('#iframe-play-broadcast').html('');
              if(action === 'stop'){
                $broadcast.find('.stop-flag').show()
              }
              if(action === 'blacklist'){
                $broadcast.find('.blacklist-flag').show()
              }
          }
        });
      }
    });
  };

  $('ul.broadcasts').on('click', '.hide-broadcast', function() { manage_broadcast(this, 'hide'); });
  $('ul.broadcasts').on('click', '.unhide-broadcast', function() { manage_broadcast(this, 'unhide'); });
  $('ul.broadcasts').on('click', '.stop-broadcast', function() { manage_broadcast(this, 'stop'); });
  $('ul.broadcasts').on('click', '.blacklist-user', function() { manage_broadcast(this, 'blacklist'); });
  var refresh_flag = true
  var modal_manage_broadcast = function(btn, action) {
    var $broadcast = $(btn).closest('.broadcast');
    var broadcast_id = $broadcast.data('id');
    $("#broadcast-id").val(broadcast_id);
    if ($('#toggle-auto-refresh').is(':checked')){
      $('#toggle-auto-refresh').prop("checked", false);
      refresh_flag = true
    }
    else{
      refresh_flag = false;
    }
    $('.modal-body').empty();
    $('.modal-footer').empty();
    if (action === 'stop'){
        $(".modal-body").append(
			'<input type="radio" name="reason" value="裸露、挑逗、传播色情" checked> 裸露、挑逗、传播色情<br>'+
			'<input type="radio" name="reason" value="言语行为过激、涉及敏感话题"> 言语行为过激、涉及敏感话题<br>'+
			'<input type="radio" name="reason" value="黑屏、花屏、无意义画面"> 黑屏、花屏、无意义画面<br>'+
            '<input type="radio" name="reason" value="其他"> 其他<br>'
         );
         $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-stop" data-dismiss="modal">提交更改</button>'
         );
    }
    if (action === 'blacklist'){
        $(".modal-body").append(
			'<input type="radio" name="reason" value="传播色情" checked> 传播色情<br>'+
			'<input type="radio" name="reason" value="停播警告多次无效果"> 停播警告多次无效果<br>'+
			'<input type="radio" name="reason" value="妨碍平台秩序管理"> 妨碍平台秩序管理<br>'+
            '<input type="radio" name="reason" value="其他"> 其他<br>'
         );
        $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-blacklist" data-dismiss="modal">提交更改</button>'
        );
    }
    if (action === 'warn'){
        $(".modal-body").append(
            '<input type="radio" name="reason" value="可能导致色情的行为、场景" checked> 可能导致色情的行为、场景<br>'+
            '<input type="radio" name="reason" value="轻度妨碍平台秩序行为"> 轻度妨碍平台秩序行为<br>'+
            '<input type="radio" name="reason" value="赌博、抽烟等不良习惯"> 涉及赌博、抽烟等不良习惯<br>'+
            '<input type="radio" name="reason" value="无意义直播画面"> 无意义直播画面<br>'
        );
        $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-warn" data-dismiss="modal">提交更改</button>'
        );
    }
  };

  var iframe_modal_manage_broadcast = function(btn, action) {
    var $broadcast = $('.is-playing');
    broadcast_id = $broadcast.data('id')
    $("#broadcast-id").val(broadcast_id);
    //clearTimeout(auto_refresh_timer);
    if ($('#toggle-auto-refresh').is(':checked')){
      $('#toggle-auto-refresh').prop("checked", false);
      refresh_flag = true;
    }
    else{
      refresh_flag = false;
    }
    //$('#toggle-auto-refresh').click();
    $('.modal-body').empty();
    $('.modal-footer').empty();
    if (action === 'stop'){
        $(".modal-body").append(
			'<input type="radio" name="reason" value="裸露、挑逗、传播色情" checked> 裸露、挑逗、传播色情<br>'+
			'<input type="radio" name="reason" value="言语行为过激、涉及敏感话题"> 言语行为过激、涉及敏感话题<br>'+
			'<input type="radio" name="reason" value="黑屏、花屏、无意义画面"> 黑屏、花屏、无意义画面<br>'+
            '<input type="radio" name="reason" value="其他"> 其他<br>'
        );
        $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-stop" data-dismiss="modal">提交更改</button>'
        );
    }
    if (action === 'blacklist'){
        $(".modal-body").append(
			'<input type="radio" name="reason" value="传播色情" checked> 传播色情<br>'+
			'<input type="radio" name="reason" value="停播警告多次无效果"> 停播警告多次无效果<br>'+
			'<input type="radio" name="reason" value="妨碍平台秩序管理"> 妨碍平台秩序管理<br>'+
            '<input type="radio" name="reason" value="其他"> 其他<br>'
        );
        $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-blacklist" data-dismiss="modal">提交更改</button>'
        );
    }
    if (action === 'warn'){
        $(".modal-body").append(
            '<input type="radio" name="reason" value="可能导致色情的行为、场景" checked> 可能导致色情的行为、场景<br>'+
            '<input type="radio" name="reason" value="轻度妨碍平台秩序行为"> 轻度妨碍平台秩序行为<br>'+
            '<input type="radio" name="reason" value="赌博、抽烟等不良习惯"> 涉及赌博、抽烟等不良习惯<br>'+
            '<input type="radio" name="reason" value="无意义直播画面"> 无意义直播画面<br>'
        );
        $(".modal-footer").append('<button type="button" class="btn btn-stop-close" data-dismiss="modal">关闭</button>'+
            '<button type="button" class="btn btn-modal-warn" data-dismiss="modal">提交更改</button>'
        );
    }
  };

  $('ul.broadcasts').on('click', '.modal-stop-broadcast', function() { modal_manage_broadcast(this, 'stop'); });
  $('ul.broadcasts').on('click', '.modal-blacklist-user', function() { modal_manage_broadcast(this, 'blacklist'); });
  $('ul.broadcasts').on('click', '.modal-warn-broadcast', function() { modal_manage_broadcast(this, 'warn'); });

  var mm_manage_broadcast = function(btn, action) {
     var reason=$('input:radio[name="reason"]:checked').val();
     var broadcast_id = $("#broadcast-id").val();
     $("#broadcast-id").val("");
     if (broadcast_id){
        //var $broadcast = $("li").filter("#" + broadcast_id);
        var $broadcast = $("li[data-id='"+broadcast_id+"']")
     }
     else{
        var $broadcast = $('.is-playing');
        broadcast_id = $broadcast.data('id')
     }
     if (!broadcast_id){
          alter('操作出问题了,请刷新界面重新操作!!')
          return;
     }
          $.post('/adm2/review/broadcast/manage/' + action + '/' + broadcast_id, {'reason':reason, 'flag':'modal'}, function(resp) {
          if (resp['blacklist'] && resp['stop']){
             alert('主播已经被封号和停播');
          }
          else if (resp['stop'] && action != 'blacklist'){
             alert('主播已经停播');
          }else{
            if (action === 'hide'){
              $broadcast.addClass('is-hidden');
              $broadcast.find('.hide-broadcast').hide()
              $broadcast.find('.unhide-broadcast').show()
            }
            if (action === 'unhide'){
              $broadcast.removeClass('is-hidden');
              $broadcast.find('.unhide-broadcast').hide()
              $broadcast.find('.hide-broadcast').show()
            }
          }
          var will_stop = action === 'stop' || action === 'blacklist';
          if (will_stop) {
              playing_broadcast_id=null;
              $('#iframe-play-broadcast').hide();
              $('#iframe-play-broadcast').html('');
              $('.iframe-btn-group').hide();
              $broadcast.removeClass('is-playing');
              if(action === 'stop'){
                $broadcast.find('.stop-flag').show()
              }
              if(action === 'blacklist'){
                $broadcast.find('.blacklist-flag').show()
              }
          }
          if (action === 'warn'){
            $broadcast.find('.warn-broadcast').empty()
            $broadcast.find('.warn-broadcast').append('⚠'+resp['n_warned'])
            if (resp['n_warned'] >= 3){
              $broadcast.find('.stop-flag').show();
              $('#iframe-play-photo').hide();
              $('#iframe-play-photo').html('');
            }
          }
        });
     $('.modal-body').empty();
     $('.modal-footer').empty();
     if (refresh_flag){
        $('#toggle-auto-refresh').click();
     }
  };
  $('ul.broadcasts').on('click', '.btn-modal-stop', function() { mm_manage_broadcast(this, 'stop'); });
  $('ul.broadcasts').on('click', '.btn-modal-blacklist', function() { mm_manage_broadcast(this, 'blacklist'); });
  $('ul.broadcasts').on('click', '.btn-modal-warn', function() { mm_manage_broadcast(this, 'warn'); });

  var modal_close = function(btn, action) {
    $('.modal-body').empty();
    $('.modal-footer').empty();
    if (refresh_flag){
        $('#toggle-auto-refresh').click()
    }
  };

  $('ul.broadcasts').on('click', '.btn-stop-close', function() { modal_close(this, 'hide'); });


   var iframe_manage_broadcast = function(btn, action) {
    // 最热／最新／已雪藏
    var $btn = $(btn);
    var $broadcast = $('.is-playing');
    var broadcast_id = $broadcast.data('id');
    var text = "确定" + $btn.text() + "“" + $broadcast.data('title') + "”？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        if (!broadcast_id){
          alter('操作出问题了,请刷新界面重新操作!!!')
          return;
        }
        $.post('/adm2/review/broadcast/manage/' + action + '/' + broadcast_id, function(resp) {
          if (resp['blacklist'] && resp['stop']){
             alert('主播已经被封号和停播');
          }
          else if (resp['stop'] && action != 'blacklist'){
             alert('主播已经停播');
          }
          if (action === 'hide'){
            $broadcast.addClass('is-hidden');
            $('#iframe-play-broadcast').hide();
            $('#iframe-play-broadcast').html('');
            $('.iframe-btn-group').hide();
          }
          if (action === 'stop' || action === 'blacklist'){
            $broadcast.removeClass('is-playing');
            $('#iframe-play-broadcast').hide();
            $('#iframe-play-broadcast').html('');
            $('.iframe-btn-group').hide();
            $broadcast.find('.stop-flag').show()
          }
          if (action === 'warn'){
            $broadcast.find('.warn-broadcast').empty()
            $broadcast.find('.warn-broadcast').append('⚠'+resp['n_warned'])
            if (resp['n_warned'] >= 3){
              $broadcast.find('.stop-flag').show();
              $('#iframe-play-photo').hide();
              $('#iframe-play-photo').html('');
            }
          }
        });
      }
    });
  };

  $('div.iframe-btn-group').on('click', '.iframe-hide-broadcast', function() { iframe_manage_broadcast(this, 'hide'); });
  $('div.iframe-btn-group').on('click', '.iframe-unhide-broadcast', function() { iframe_manage_broadcast(this, 'unhide'); });
  $('div.iframe-btn-group').on('click', '.iframe-stop-broadcast', function() { iframe_modal_manage_broadcast(this, 'stop'); });
  $('div.iframe-btn-group').on('click', '.iframe-blacklist-user', function() { iframe_modal_manage_broadcast(this, 'blacklist'); });
  $('div.iframe-btn-group').on('click', '.iframe-warn-broadcast', function() { iframe_modal_manage_broadcast(this, 'warn'); });


  $('div.iframe-btn-group').on('click', '.iframe-stop', function() {
     var $broadcast = $('.is-playing');
     $broadcast.removeClass('is-playing');
     $('#iframe-play-broadcast').hide();
     $('#iframe-play-broadcast').html('');
     $('.iframe-btn-group').hide();
     playing_broadcast_id=null;
  });

  $("#checkAll").change(function() {
    $('.avatar_checkbox').prop("checked", this.checked);
  });

  var review_user_avatar = function(btn, action) {
    var $btn = $(btn);
    var $broadcast = $(btn).closest('.broadcast');
    var user_id = $broadcast.data('id');
    var text = "确定头像审核" + $btn.text() + "？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        $.post('/adm2/review/review_user_avatar/' + user_id + '/' + action, function(resp) {
          $broadcast.fadeOut(function() {
            $(this).remove();
            if ($broadcast.hasClass('is-playing')) {
              $('#iframe-play-broadcast').hide();
              $('#iframe-play-broadcast').html('');
            }
          });
        });
      }
    });
  };
  $('ul.user_avatar').on('click', '.good_user_avatar', function() { review_user_avatar(this, 'good_avatar'); });
  $('ul.user_avatar').on('click', '.bad_user_avatar', function() { review_user_avatar(this, 'bad_avatar'); });

  $('ul.user_avatar').on('click', '.high-dangerous-good-user-avatar', function() { review_user_avatar(this, 'high_dangerous_good_avatar'); });
  $('ul.user_avatar').on('click', '.high-dangerous-bad-user-avatar', function() { review_user_avatar(this, 'high_dangerous_bad_avatar'); });

  var all_review_user_avatar = function(btn, action) {
    var $btn = $(btn);
    var $broadcast = $(btn).closest('.broadcast');
    var user_id = $broadcast.data('id');
    var text = "确定头像审核" + $btn.text() + "？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
         var r=document.getElementsByName("subBox");
         var res=''
         for(var i=0;i<r.length;i++){
         if(r[i].checked){
          if (res){
            res+="," + r[i].value;
          }else{
            res = r[i].value
          }
        }
        }
        $.post('/adm2/review/review_user_avatar/0/' + action, {'data':res}, function(resp) {
            location.reload();
        });

      }
    });
  };
  $('ul.user_avatar').on('click', '.all_good_user_avatar', function() { all_review_user_avatar(this, 'good_avatar'); });
  $('ul.user_avatar').on('click', '.all_bad_user_avatar', function() { all_review_user_avatar(this, 'bad_avatar'); });

  $('ul.user_avatar').on('click', '.user_avatar_refresh', function() {location.reload();})

  var playing_broadcast_id;
  $('ul.broadcasts').on('click', '.play-broadcast', function() {
    var $li = $(this).closest('li');
    if ($li.hasClass('is-playing')) {
      $('#iframe-play-broadcast').hide();
      $('#iframe-play-broadcast').html('');
      $('.iframe-btn-group').hide();
      $li.toggleClass('is-playing');
    } else {
      playing_broadcast_id = $li.data('id');
      $('#iframe-broadcast-id').val(playing_broadcast_id)
      $('ul.broadcasts').find('li').removeClass('is-playing');
      $.post('/adm2/review/broadcast/status/' + playing_broadcast_id, function(resp) {
        if (resp['stop']){
          alert('主播已经被停播');
        }
        else{
          $('#iframe-play-broadcast').show();
          $('.iframe-btn-group').show();
          $li.toggleClass('is-playing');
        }
      });
    }


  });

  // 自动刷新
  var initial_count_down = 20;
  var auto_refresh_timer;

  var start_auto_refresh = function() {
    if (!$('#toggle-auto-refresh').is(':checked')) {
      return;
    }

    var count_down = parseInt($('.count-down').text());
    count_down--;
    if (count_down === 0) {
      var snippet_url = window.location.pathname + '/_snippet';
      $.get(snippet_url, function(resp) {
        $('.auto-refresh-wrapper').html(resp);
        $('li.broadcast[data-id=' + playing_broadcast_id + ']').addClass('is-playing');
      }).always(function() {
        $('.count-down').text(initial_count_down);
        auto_refresh_timer = delay(1000, start_auto_refresh);
      });
    } else {
      $('.count-down').text(count_down);
      auto_refresh_timer = delay(1000, start_auto_refresh);
    }
  };

  start_auto_refresh();

  $('#toggle-auto-refresh').change(function() {
    clearTimeout(auto_refresh_timer);
    if ($(this).is(':checked')) {
      start_auto_refresh();
    }
  });

  // 照片管理
  var manage_photo = function(btn, action) {
    var $btn = $(btn);
    var $photo = $(btn).closest('.photo');
    var photo_id = $photo.data('id');
    var text = "确定" + $btn.text() + "？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        $.post('/adm2/review/photo/manage/' + action + '/' + photo_id, function(resp) {
          $photo.fadeOut(function() {
            $(this).remove();
            var will_stop = action === 'stop' || action === 'blacklist';
            if (will_stop && $photo.hasClass('is-playing')) {
              $('#iframe-play-photo').hide();
              $('#iframe-play-photo').html('');
            }
          });
        });
      }
    });
  };

  $('ul.photos').on('click', '.delete-photo', function() { manage_photo(this, 'delete'); });
  $('ul.photos').on('click', '.blacklist-user', function() { manage_photo(this, 'blacklist'); });


  $('body').on('click', '.avatar-url', function() {
    var $this = $(this);
    var username = $this.data('username');
    var user_id = $this.data('user-id');
    bootbox.confirm('确定封禁用户' + username + '的头像', function(ok) {
      if (ok) {
        $.post('/adm2/review/block_avatar/' + user_id, function() {
          bootbox.alert('头像封禁成功');
        });
      }
    });
  });

  // verify all / sign-in / away / sign-out
  $('.reviewer-verify-all').click(function() {
    $.post('/adm2/review/verify_all', function() {
      // 使用 boot.alert 后调用 reload() 会闪掉
      alert('处理成功');
      location.reload();
    });
  });

  $('.reviewer-sign-in').click(function() {
    $.post('/adm2/review/sign_in', function() {
      alert('签到成功');
      location.reload();
    });
  });

  $('.reviewer-away').click(function() {
    $.post('/adm2/review/away', function() {
      alert('离开成功');
      location.reload();
    });
  });

  $('.reviewer-sign-out').click(function() {
    $.post('/adm2/review/sign_out', function() {
      alert('下班成功');
      location.reload();
    });
  });

  $('.form-filters :input').on('change', function() {
    $(this).closest('.form-filters').submit();
  });

  $('.input-date').datetimepicker({'format': 'YYYY-MM-DD'});

  var warn_fun = function(btn,action) {
    if (action === 'iframe_warn'){
      var $broadcast = $('.is-playing');
    }
    else{
      var $broadcast = $(btn).closest('.broadcast');
    }
    var broadcast_id = $broadcast.data('id');
    var text = "确定警告" + "“" + $broadcast.data('title') + "”？";
    bootbox.confirm(text, function(ok) {
      if (ok) {
        $.post('/adm2/review/warn/' + broadcast_id, function(resp) {
          $broadcast.find('.warn-broadcast').empty()
          $broadcast.find('.warn-broadcast').append('⚠'+resp['n_warned'])
          if (resp['n_warned'] >= 3){
            $broadcast.find('.stop-flag').show();
            $(this).removeClass('warn-broadcast')
            $('#iframe-play-photo').hide();
            $('#iframe-play-photo').html('');
          }
        });
      };
    });
  };
//  $('ul.broadcasts').on('click', '.warn-broadcast', function() {warn_fun(this)});
//  $('ul.broadcasts').on('click', '.btn-warn-broadcast', function() {warn_fun(this)});

  $('.blacklist_rollback').click(function() {
  var $btn = $(this)
  adminactivity_id = $btn.data('id')
  var text = "确定" + "“" + $(this).text()  + "”？";
  bootbox.confirm(text, function(ok) {
    if (ok){
        $.post('/adm2/adminactivity/rollback/' + adminactivity_id, function(resp) {
          $btn.remove();
        });
    }
  });
  });

  $('.cert-user-real-info').click(function() {
    var user_id = $(this).data('id');
    window.location.href="/adm2/review/certificate/info" + '/' + user_id + '/certificate'
  });

  $('.cert-user-vip-info').click(function() {
    var user_id = $(this).data('id');
    window.location.href="/adm2/review/certificate/info" + '/' + user_id + '/vip'
  });

  var certificate_manage = function(btn, action) {
    var user_id = $(btn).data('id');
    var text = "";
    if (action === 'approve_certificate'){
        text = '确定实名认证通过？'
    }
    else if (action === 'disapprove_certificate'){
        text = '确定实名认证不通过？'
    }
    else if (action === 'approve_vip'){
        text = "确定VIP认证通过？";
    }
    else if (action === 'disapprove_vip'){
        text = "确定VIP认证不通过？";
    }
    var reason = $(".certificate-modal").find('.certificate-reason').val()
    if( (action === 'disapprove_certificate'|| action === 'disapprove_vip') && reason === ""){
      alert("拒绝通过的理由不能为空");
      return;
    };
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/review/certificate/manage/' + user_id + "/" + action, {'reason':reason}, function(resp) {
          if (action === 'disapprove_certificate' || action === 'approve_certificate'){
            window.location.href="/adm2/review/certificate/certificate"
          }
          else if (action === 'disapprove_vip' || action === 'approve_vip'){
            window.location.href="/adm2/review/certificate/vip"
          }
        });
      }
    });
  };

  $('.cert-user-real-info-ok').click(function() {
    var user_id = $(this).data('id');
    var text = "确定实名认证通过？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/review/certificate/manage/' + user_id + "/approve_certificate", function(resp) {
          window.location.href="/adm2/review/certificate/certificate"
        });
      }
    });
  });

   $('.cert-user-vip-info-ok').click(function() {
    var user_id = $(this).data('id');
    var text = "确定VIP认证通过？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/review/certificate/manage/' + user_id + "/approve_vip", function(resp) {
          window.location.href="/adm2/review/certificate/vip"
        });
      }
    });
  });

  $('.btn-modal-certificate-realname-no').click(function() {
    var user_id = $(this).data('id');
    var text = "确定实名认证不通过？";
    var reason = $('.certificate-reason').val()
    if(reason === ""){
      alert("拒绝通过的理由不能为空");
      return;
    };
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/review/certificate/manage/' + user_id + "/disapprove_certificate", {'reason':reason}, function(resp) {
          window.location.href="/adm2/review/certificate/certificate"
        });
      }
    });
  });

  $('.btn-modal-certificate-vip-no').click(function() {
    var user_id = $(this).data('id');
    var text = "确定VIP认证不通过 ？";
    var reason = $('.certificate-reason').val()
    if(reason === ""){
      alert("拒绝通过的理由不能为空");
      return;
    };
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/review/certificate/manage/' + user_id + "/disapprove_vip", {'reason':reason}, function(resp) {
          window.location.href="/adm2/review/certificate/vip"
        });
      }
    });
  });

  $('.go-certificate-realname').click(function() {
    window.location.href="/adm2/review/certificate/certificate"
  });

  $('.go-certificate-vip').click(function() {
    window.location.href="/adm2/review/certificate/vip"
  });

  var modal_certificate = function(btn, action) {
    var certificate_id = $(btn).data('id');
    $("#certificate-id").val(certificate_id);
    $(".certificate-modal").find('.modal-footer').empty();
    if (action === 'certificate'){
      $(".certificate-modal").find(".modal-footer").append(
              '<button type="button" class="btn btn-modal-close" data-dismiss="modal">取消</button>' +
              '<button type="button" class="btn btn-modal-certificate-realname-no" data-dismiss="modal" data-id="' + certificate_id + '">确认</button>'
              )
    }
    else if (action === 'vip'){
      $(".certificate-modal").find(".modal-footer").append(
              '<button type="button" class="btn btn-modal-close" data-dismiss="modal">取消</button>' +
              '<button type="button" class="btn btn-modal-certificate-vip-no" data-dismiss="modal" data-id="' + certificate_id + '">确认</button>'
              )
    }
  };

  $('.cert-realname-list-modal').click(function() {modal_certificate(this, 'certificate');});
  $('.cert-vip-list-modal').click(function() {modal_certificate(this, 'vip');});
  $('ul.certificates').on('click', '.btn-modal-certificate-realname-no', function() { certificate_manage(this, 'disapprove_certificate'); });
  $('ul.certificates').on('click', '.btn-modal-certificate-vip-no', function() { certificate_manage(this, 'disapprove_vip'); });

  $('.certificate-certificate-search').click(function(){
    var user_id = $('.certificate-search-user-id').val()
    window.location.href="/adm2/review/certificate/certificate?user_id="+user_id
  });
  $('.certificate-vip-search').click(function(){
    var user_id = $('.certificate-search-user-id').val()
    window.location.href="/adm2/review/certificate/vip?user_id="+user_id
  });

  $('.add-free-certificate-user').click(function() {
    var user_id = $('.free-certificate-user-id').val();
    var text = "确定添加该用户？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/certificate/manage/free_certificate/add/' + user_id, function(resp) {
          window.location.href="/adm2/certificate/free_certificate"
        });
      }
    });
  });

  $('.delete-free-certificate-user').click(function() {
    var user_id = $(this).data('id');
    var text = "确定删除该用户？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/certificate/manage/free_certificate/delete/' + user_id, function(resp) {
          window.location.href="/adm2/certificate/free_certificate"
        });
      }
    });
  });

  $('.add_bots_followship').click(function() {
    var user_id = $('.add_bots_followship-user-id').val();
    var small_num = $('.add_bots_followship-small-num').val();
    var big_num = $('.add_bots_followship-big-num').val();
    var add_num = $('.add_bots_followship-add-num').val();
    var big_add_num = $('.big_add_bots_followship-add-num').val();
    var all_num = $('.add_bots_followship-all-num').val();
    var started_time = $('#bots_followship_date_from').val()
    var ended_time = $('#bots_followship_date_to').val()

    var data = {'user_id':user_id, 'small_num':small_num, 'big_num':big_num, 'add_num':add_num, 'all_num':all_num, 'big_add_num':big_add_num, 'started_time':started_time, 'ended_time':ended_time}
    var text = "确定添加该用户？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/botsoperation/manage/bots_followship/add/' + user_id, data, function(resp) {
          window.location.href="/adm2/botsoperation/add_bots_followship"
        });
      }
    });
  });

  $('.delete-bots_followship').click(function() {
    var user_id = $(this).data('id');
    var text = "确定删除该用户？";
    bootbox.confirm(text, function(ok) {
      if (ok){
        $.post('/adm2/botsoperation/manage/bots_followship/delete/' + user_id, function(resp) {
          window.location.href="/adm2/botsoperation/add_bots_followship"
        });
      }
    });
  });

function poll_review_count() {
  $.post('/adm2/review/count', function(resp) {
        $('.new-avatar-count').text(resp['n_waiting_avatar']);
    });
}
poll_review_count();
setInterval(poll_review_count, 30000);

}).call(this);
