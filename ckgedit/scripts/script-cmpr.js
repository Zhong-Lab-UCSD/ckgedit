var HTMLParser;var HTMLParserInstalled=true;var HTMLParser_Elements=new Array();(function(){var k=/^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,c=/^<\/(\w+)[^>]*>/,f=/(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;var e=b("br,col,hr,img");var a=b("blockquote,center,del,div,dl,dt,hr,iframe,ins,li,ol,p,pre,table,tbody,td,tfoot,th,thead,tr,ul");var h=b("a,abbr,acronym,b,big,br,cite,code,del,em,font,h1,h2,h3,h4,h5,h6,i,img,ins,kbd,q,s,samp,small,span,strike,strong,sub,sup,tt,u,var");var d=b("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");var j=b("checked,disabled,ismap,noresize,nowrap,readonly,selected");var g=b("script,style");HTMLParser=this.HTMLParser=function(m,u){var p,q,n,r=[],s=m;r.last=function(){return this[this.length-1]};while(m){q=true;if(!r.last()||!g[r.last()]){if(m.indexOf("<!--")==0){p=m.indexOf("-->");if(p>=0){if(u.comment){u.comment(m.substring(4,p))}m=m.substring(p+3);q=false}}else{if(m.indexOf("</")==0){n=m.match(c);if(n){m=m.substring(n[0].length);n[0].replace(c,o);q=false}}else{if(m.indexOf("<")==0){n=m.match(k);if(n){m=m.substring(n[0].length);n[0].replace(k,l);q=false}}}}if(q){p=m.indexOf("<");var t=p<0?m:m.substring(0,p);m=p<0?"":m.substring(p);if(u.chars){u.chars(t)}}}else{m=m.replace(new RegExp("(.*)</"+r.last()+"[^>]*>"),function(v,w){w=w.replace(/<!--(.*?)-->/g,"$1").replace(/<!\[CDATA\[(.*?)]]>/g,"$1");if(u.chars){u.chars(w)}return""});o("",r.last())}if(m==s){throw"Parse Error: "+m}s=m}o();function l(v,y,z,w){if(a[y]){while(r.last()&&h[r.last()]){o("",r.last())}}if(d[y]&&r.last()==y){o("",y)}w=e[y]||!!w;if(!w){r.push(y)}if(u.start){var x=[];z.replace(f,function(B,A){var C=arguments[2]?arguments[2]:arguments[3]?arguments[3]:arguments[4]?arguments[4]:j[A]?A:"";x.push({name:A,value:C,escaped:C.replace(/(^|[^\\])"/g,'$1\\"')})});if(u.start){u.start(y,x,w)}}}function o(v,x){if(!x){var y=0}else{for(var y=r.length-1;y>=0;y--){if(r[y]==x){break}}}if(y>=0){for(var w=r.length-1;w>=y;w--){if(u.end){u.end(r[w])}}r.length=y}}};function b(o){var n={},l=o.split(",");for(var m=0;m<l.length;m++){n[l[m]]=true}return n}})();function HTMLParser_test_result(a){var d="";for(i=0;i<a.length;i++){var c=a.charAt(i);if(a.charCodeAt(i)==10){c="\\n"}if(a.charCodeAt(i)==32){c="SP"}var b=c+" ";d+=b;if(a.charCodeAt(i)==10){d+="\n"}}if(!confirm(d)){return false}return true}function hide_backup_msg(){document.getElementById("backup_msg").style.display="none";return false}function show_backup_msg(a){document.getElementById("backup_msg").style.display="block";document.getElementById("backup_msg_area").innerHTML="Backed up to: "+a;return false}function remove_draft(){}function dwedit_draft_delete(b){var a=false;var c="draft_id="+b;jQuery.ajax({url:DOKU_BASE+"lib/plugins/ckgedit/scripts/prev_delete.php",async:false,data:c,type:"POST",dataType:"html",success:function(d){if(a){alert(d)}}})}if(!window.jQuery){var jQuery={ajax:function(b){var a=new sack(b.url);a.asynchronous=b.async;a.onCompletion=function(){if(a.responseStatus&&a.responseStatus[0]==200){b.success(a.response)}};a.runAJAX(b.data)},post:function(a,d,e,b){var c=new sack(a);c.onCompletion=function(){if(c.responseStatus&&c.responseStatus[0]==200){e(c.response)}};c.runAJAX(d)}}}function GetE(a){return document.getElementById(a)}var dokuBase=location.host+DOKU_BASE;function _getSelection(g){if(!g){return}var d=new selection_class();d.obj=g;d.start=g.value.length;d.end=g.value.length;g.focus();if(document.getSelection){d.start=g.selectionStart;d.end=g.selectionEnd;d.scroll=g.scrollTop}else{if(document.selection){d.rangeCopy=document.selection.createRange().duplicate();if(g.tagName==="INPUT"){var e=g.createTextRange();e.expand("textedit")}else{var e=document.body.createTextRange();e.moveToElementText(g)}e.setEndPoint("EndToStart",d.rangeCopy);var c=false,b=false;var h,f;h=e.text;f=d.rangeCopy.text;d.start=h.length;d.end=d.start+f.length;do{if(!c){if(e.compareEndPoints("StartToEnd",e)==0){c=true}else{e.moveEnd("character",-1);if(e.text==h){d.start+=2;d.end+=2}else{c=true}}}if(!b){if(d.rangeCopy.compareEndPoints("StartToEnd",d.rangeCopy)==0){b=true}else{d.rangeCopy.moveEnd("character",-1);if(d.rangeCopy.text==f){d.end+=2}else{b=true}}}}while((!c||!b));var a=function(k){var j=k.split("\r\n");if(!j||!j.length){return 0}return j.length-1};d.fix=a(d.obj.value.substring(0,d.start))}}return d};