export * from 'highlight.js/lib/highlight';

import {registerLanguage} from 'highlight.js/lib/highlight';

// Exclude some languages to reduce the bundle's size

// 107719 isbl.js
//  65549 mathematica.js
//  64420 1c.js
//  59771 gml.js
//  37164 sqf.js
//  33385 maxima.js
//  28340 pgsql.js
//  20891 x86asm.js
//  18903 mel.js
//  16864 stata.js
//  15833 gauss.js
//  14604 sql.js
registerLanguage('sql', require('highlight.js/lib/languages/sql'))
//  13386 lsl.js
// registerLanguage('lsl', require('highlight.js/lib/languages/lsl'))
//  10134 vim.js
registerLanguage('vim', require('highlight.js/lib/languages/vim'))
//  10024 autoit.js
// registerLanguage('autoit', require('highlight.js/lib/languages/autoit'))
//   9755 livecodeserver.js
// registerLanguage('livecodeserver', require('highlight.js/lib/languages/livecodeserver'))
//   9691 glsl.js
registerLanguage('glsl', require('highlight.js/lib/languages/glsl'))
//   8681 stylus.js
// registerLanguage('stylus', require('highlight.js/lib/languages/stylus'))
//   7186 scss.js
registerLanguage('scss', require('highlight.js/lib/languages/scss'))
//   7182 julia.js
registerLanguage('julia', require('highlight.js/lib/languages/julia'))
//   7128 powershell.js
registerLanguage('powershell', require('highlight.js/lib/languages/powershell'))
//   6789 reasonml.js
// registerLanguage('reasonml', require('highlight.js/lib/languages/reasonml'))
//   6471 d.js
registerLanguage('d', require('highlight.js/lib/languages/d'))
//   6471 routeros.js
// registerLanguage('routeros', require('highlight.js/lib/languages/routeros'))
//   6456 cpp.js
registerLanguage('cpp', require('highlight.js/lib/languages/cpp'))
//   6371 ada.js
registerLanguage('ada', require('highlight.js/lib/languages/ada'))
//   6167 crystal.js
// registerLanguage('crystal', require('highlight.js/lib/languages/crystal'))
//   5989 nsis.js
// registerLanguage('nsis', require('highlight.js/lib/languages/nsis'))
//   5865 verilog.js
registerLanguage('verilog', require('highlight.js/lib/languages/verilog'))
//   5744 kotlin.js
registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'))
//   5609 sas.js
registerLanguage('sas', require('highlight.js/lib/languages/sas'))
//   5463 cs.js
registerLanguage('cs', require('highlight.js/lib/languages/cs'))
//   5409 puppet.js
// registerLanguage('puppet', require('highlight.js/lib/languages/puppet'))
//   5401 irpf90.js
// registerLanguage('irpf90', require('highlight.js/lib/languages/irpf90'))
//   5251 excel.js
// registerLanguage('excel', require('highlight.js/lib/languages/excel'))
//   5157 qml.js
registerLanguage('qml', require('highlight.js/lib/languages/qml'))
//   5111 arduino.js
// registerLanguage('arduino', require('highlight.js/lib/languages/arduino'))
//   5061 fortran.js
registerLanguage('fortran', require('highlight.js/lib/languages/fortran'))
//   5016 cos.js
// registerLanguage('cos', require('highlight.js/lib/languages/cos'))
//   4958 perl.js
registerLanguage('perl', require('highlight.js/lib/languages/perl'))
//   4952 javascript.js
registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
//   4866 less.js
registerLanguage('less', require('highlight.js/lib/languages/less'))
//   4844 lasso.js
// registerLanguage('lasso', require('highlight.js/lib/languages/lasso'))
//   4808 scheme.js
registerLanguage('scheme', require('highlight.js/lib/languages/scheme'))
//   4761 swift.js
registerLanguage('swift', require('highlight.js/lib/languages/swift'))
//   4747 typescript.js
registerLanguage('typescript', require('highlight.js/lib/languages/typescript'))
//   4671 ruby.js
registerLanguage('ruby', require('highlight.js/lib/languages/ruby'))
//   4603 gams.js
// registerLanguage('gams', require('highlight.js/lib/languages/gams'))
//   4524 ruleslanguage.js
// registerLanguage('ruleslanguage', require('highlight.js/lib/languages/ruleslanguage'))
//   4470 clojure.js
registerLanguage('clojure', require('highlight.js/lib/languages/clojure'))
//   4404 aspectj.js
// registerLanguage('aspectj', require('highlight.js/lib/languages/aspectj'))
//   4372 armasm.js
// registerLanguage('armasm', require('highlight.js/lib/languages/armasm'))
//   4294 asciidoc.js
// registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'))
//   4243 livescript.js
// registerLanguage('livescript', require('highlight.js/lib/languages/livescript'))
//   4204 n1ql.js
// registerLanguage('n1ql', require('highlight.js/lib/languages/n1ql'))
//   4186 coq.js
registerLanguage('coq', require('highlight.js/lib/languages/coq'))
//   4091 arcade.js
// registerLanguage('arcade', require('highlight.js/lib/languages/arcade'))
//   4076 hy.js
// registerLanguage('hy', require('highlight.js/lib/languages/hy'))
//   3859 mipsasm.js
registerLanguage('mipsasm', require('highlight.js/lib/languages/mipsasm'))
//   3808 coffeescript.js
registerLanguage('coffeescript', require('highlight.js/lib/languages/coffeescript'))
//   3745 hsp.js
registerLanguage('hsp', require('highlight.js/lib/languages/hsp'))
//   3586 processing.js
registerLanguage('processing', require('highlight.js/lib/languages/processing'))
//   3519 php.js
registerLanguage('php', require('highlight.js/lib/languages/php'))
//   3506 erlang.js
registerLanguage('erlang', require('highlight.js/lib/languages/erlang'))
//   3368 haxe.js
registerLanguage('haxe', require('highlight.js/lib/languages/haxe'))
//   3341 matlab.js
registerLanguage('matlab', require('highlight.js/lib/languages/matlab'))
//   3310 java.js
registerLanguage('java', require('highlight.js/lib/languages/java'))
//   3300 llvm.js
registerLanguage('llvm', require('highlight.js/lib/languages/llvm'))
//   3292 rust.js
registerLanguage('rust', require('highlight.js/lib/languages/rust'))
//   3235 applescript.js
registerLanguage('applescript', require('highlight.js/lib/languages/applescript'))
//   3211 objectivec.js
registerLanguage('objectivec', require('highlight.js/lib/languages/objectivec'))
//   3122 groovy.js
registerLanguage('groovy', require('highlight.js/lib/languages/groovy'))
//   3107 moonscript.js
// registerLanguage('moonscript', require('highlight.js/lib/languages/moonscript'))
//   3065 zephir.js
// registerLanguage('zephir', require('highlight.js/lib/languages/zephir'))
//   3025 cmake.js
registerLanguage('cmake', require('highlight.js/lib/languages/cmake'))
//   2979 xml.js
registerLanguage('xml', require('highlight.js/lib/languages/xml'))
//   2901 haskell.js
registerLanguage('haskell', require('highlight.js/lib/languages/haskell'))
//   2867 stan.js
registerLanguage('stan', require('highlight.js/lib/languages/stan'))
//   2829 python.js
registerLanguage('python', require('highlight.js/lib/languages/python'))
//   2788 angelscript.js
registerLanguage('angelscript', require('highlight.js/lib/languages/angelscript'))
//   2777 lua.js
registerLanguage('lua', require('highlight.js/lib/languages/lua'))
//   2776 css.js
registerLanguage('css', require('highlight.js/lib/languages/css'))
//   2747 mercury.js
// registerLanguage('mercury', require('highlight.js/lib/languages/mercury'))
//   2664 avrasm.js
// registerLanguage('avrasm', require('highlight.js/lib/languages/avrasm'))
//   2622 oxygene.js
// registerLanguage('oxygene', require('highlight.js/lib/languages/oxygene'))
//   2570 vhdl.js
registerLanguage('vhdl', require('highlight.js/lib/languages/vhdl'))
//   2551 dart.js
registerLanguage('dart', require('highlight.js/lib/languages/dart'))
//   2528 haml.js
registerLanguage('haml', require('highlight.js/lib/languages/haml'))
//   2512 purebasic.js
// registerLanguage('purebasic', require('highlight.js/lib/languages/purebasic'))
//   2483 delphi.js
registerLanguage('delphi', require('highlight.js/lib/languages/delphi'))
//   2477 elixir.js
registerLanguage('elixir', require('highlight.js/lib/languages/elixir'))
//   2473 vbnet.js
registerLanguage('vbnet', require('highlight.js/lib/languages/vbnet'))
//   2435 django.js
registerLanguage('django', require('highlight.js/lib/languages/django'))
//   2430 dts.js
registerLanguage('dts', require('highlight.js/lib/languages/dts'))
//   2418 scala.js
registerLanguage('scala', require('highlight.js/lib/languages/scala'))
//   2368 markdown.js
registerLanguage('markdown', require('highlight.js/lib/languages/markdown'))
//   2366 tp.js
registerLanguage('tp', require('highlight.js/lib/languages/tp'))
//   2329 xl.js
registerLanguage('xl', require('highlight.js/lib/languages/xl'))
//   2321 nginx.js
registerLanguage('nginx', require('highlight.js/lib/languages/nginx'))
//   2320 bash.js
registerLanguage('bash', require('highlight.js/lib/languages/bash'))
//   2306 tcl.js
registerLanguage('tcl', require('highlight.js/lib/languages/tcl'))
//   2303 lisp.js
registerLanguage('lisp', require('highlight.js/lib/languages/lisp'))
//   2281 crmsh.js
// registerLanguage('crmsh', require('highlight.js/lib/languages/crmsh'))
//   2203 ocaml.js
registerLanguage('ocaml', require('highlight.js/lib/languages/ocaml'))
//   2162 yaml.js
registerLanguage('yaml', require('highlight.js/lib/languages/yaml'))
//   2117 basic.js
registerLanguage('basic', require('highlight.js/lib/languages/basic'))
//   2086 actionscript.js
registerLanguage('actionscript', require('highlight.js/lib/languages/actionscript'))
//   2013 gcode.js
registerLanguage('gcode', require('highlight.js/lib/languages/gcode'))
//   2006 sml.js
registerLanguage('sml', require('highlight.js/lib/languages/sml'))
//   1978 pony.js
registerLanguage('pony', require('highlight.js/lib/languages/pony'))
//   1968 elm.js
registerLanguage('elm', require('highlight.js/lib/languages/elm'))
//   1954 makefile.js
registerLanguage('makefile', require('highlight.js/lib/languages/makefile'))
//   1937 xquery.js
// registerLanguage('xquery', require('highlight.js/lib/languages/xquery'))
//   1933 dns.js
// registerLanguage('dns', require('highlight.js/lib/languages/dns'))
//   1907 monkey.js
// registerLanguage('monkey', require('highlight.js/lib/languages/monkey'))
//   1903 nimrod.js
// registerLanguage('nimrod', require('highlight.js/lib/languages/nimrod'))
//   1827 ceylon.js
// registerLanguage('ceylon', require('highlight.js/lib/languages/ceylon'))
//   1825 gradle.js
// registerLanguage('gradle', require('highlight.js/lib/languages/gradle'))
//   1818 pf.js
// registerLanguage('pf', require('highlight.js/lib/languages/pf'))
//   1768 smali.js
// registerLanguage('smali', require('highlight.js/lib/languages/smali'))
//   1748 cal.js
// registerLanguage('cal', require('highlight.js/lib/languages/cal'))
//   1732 vbscript.js
registerLanguage('vbscript', require('highlight.js/lib/languages/vbscript'))
//   1725 scilab.js
//registerLanguage('scilab', require('highlight.js/lib/languages/scilab'))
//   1724 properties.js
registerLanguage('properties', require('highlight.js/lib/languages/properties'))
//   1692 autohotkey.js
// registerLanguage('autohotkey', require('highlight.js/lib/languages/autohotkey'))
//   1685 r.js
registerLanguage('r', require('highlight.js/lib/languages/r'))
//   1671 twig.js
// registerLanguage('twig', require('highlight.js/lib/languages/twig'))
//   1651 htmlbars.js
// registerLanguage('htmlbars', require('highlight.js/lib/languages/htmlbars'))
//   1631 fsharp.js
registerLanguage('fsharp', require('highlight.js/lib/languages/fsharp'))
//   1629 openscad.js
// registerLanguage('openscad', require('highlight.js/lib/languages/openscad'))
//   1575 dos.js
registerLanguage('dos', require('highlight.js/lib/languages/dos'))
//   1573 abnf.js
registerLanguage('abnf', require('highlight.js/lib/languages/abnf'))
//   1477 rib.js
// registerLanguage('rib', require('highlight.js/lib/languages/rib'))
//   1469 ini.js
registerLanguage('ini', require('highlight.js/lib/languages/ini'))
//   1461 go.js
registerLanguage('go', require('highlight.js/lib/languages/go'))
//   1406 vala.js
registerLanguage('vala', require('highlight.js/lib/languages/vala'))
//   1360 inform7.js
// registerLanguage('inform7', require('highlight.js/lib/languages/inform7'))
//   1325 roboconf.js
// registerLanguage('roboconf', require('highlight.js/lib/languages/roboconf'))
//   1320 capnproto.js
// registerLanguage('capnproto', require('highlight.js/lib/languages/capnproto'))
//   1316 rsl.js
// registerLanguage('rsl', require('highlight.js/lib/languages/rsl'))
//   1307 tex.js
registerLanguage('tex', require('highlight.js/lib/languages/tex'))
//   1299 apache.js
registerLanguage('apache', require('highlight.js/lib/languages/apache'))
//   1275 prolog.js
registerLanguage('prolog', require('highlight.js/lib/languages/prolog'))
//   1246 smalltalk.js
registerLanguage('smalltalk', require('highlight.js/lib/languages/smalltalk'))
//   1235 q.js
registerLanguage('q', require('highlight.js/lib/languages/q'))
//   1228 jboss-cli.js
registerLanguage('jboss-cli', require('highlight.js/lib/languages/jboss-cli'))
//   1127 step21.js
registerLanguage('step21', require('highlight.js/lib/languages/step21'))
//   1059 awk.js
registerLanguage('awk', require('highlight.js/lib/languages/awk'))
//   1038 axapta.js
// registerLanguage('axapta', require('highlight.js/lib/languages/axapta'))
//   1029 dsconfig.js
// registerLanguage('dsconfig', require('highlight.js/lib/languages/dsconfig'))
//   1019 erlang-repl.js
registerLanguage('erlang-repl', require('highlight.js/lib/languages/erlang-repl'))
//   1008 flix.js
registerLanguage('flix', require('highlight.js/lib/languages/flix'))
//   1001 nix.js
registerLanguage('nix', require('highlight.js/lib/languages/nix'))
//    978 protobuf.js
registerLanguage('protobuf', require('highlight.js/lib/languages/protobuf'))
//    947 http.js
registerLanguage('http', require('highlight.js/lib/languages/http'))
//    942 thrift.js
registerLanguage('thrift', require('highlight.js/lib/languages/thrift'))
//    937 json.js
registerLanguage('json', require('highlight.js/lib/languages/json'))
//    924 parser3.js
registerLanguage('parser3', require('highlight.js/lib/languages/parser3'))
//    901 diff.js
registerLanguage('diff', require('highlight.js/lib/languages/diff'))
//    895 handlebars.js
// registerLanguage('handlebars', require('highlight.js/lib/languages/handlebars'))
//    862 julia-repl.js
registerLanguage('julia-repl', require('highlight.js/lib/languages/julia-repl'))
//    860 leaf.js
registerLanguage('leaf', require('highlight.js/lib/languages/leaf'))
//    827 accesslog.js
registerLanguage('accesslog', require('highlight.js/lib/languages/accesslog'))
//    825 mizar.js
// registerLanguage('mizar', require('highlight.js/lib/languages/mizar'))
//    794 gherkin.js
// registerLanguage('gherkin', require('highlight.js/lib/languages/gherkin'))
//    756 dust.js
// registerLanguage('dust', require('highlight.js/lib/languages/dust'))
//    751 subunit.js
// registerLanguage('subunit', require('highlight.js/lib/languages/subunit'))
//    751 tap.js
// registerLanguage('tap', require('highlight.js/lib/languages/tap'))
//    716 golo.js
// registerLanguage('golo', require('highlight.js/lib/languages/golo'))
//    705 brainfuck.js
// registerLanguage('brainfuck', require('highlight.js/lib/languages/brainfuck'))
//    701 ebnf.js
registerLanguage('ebnf', require('highlight.js/lib/languages/ebnf'))
//    692 profile.js
registerLanguage('profile', require('highlight.js/lib/languages/profile'))
//    682 clean.js
registerLanguage('clean', require('highlight.js/lib/languages/clean'))
//    670 taggerscript.js
registerLanguage('taggerscript', require('highlight.js/lib/languages/taggerscript'))
//    585 fix.js
registerLanguage('fix', require('highlight.js/lib/languages/fix'))
//    545 csp.js
registerLanguage('csp', require('highlight.js/lib/languages/csp'))
//    541 bnf.js
registerLanguage('bnf', require('highlight.js/lib/languages/bnf'))
//    523 dockerfile.js
registerLanguage('dockerfile', require('highlight.js/lib/languages/dockerfile'))
//    486 ldif.js
registerLanguage('ldif', require('highlight.js/lib/languages/ldif'))
//    471 mojolicious.js
// registerLanguage('mojolicious', require('highlight.js/lib/languages/mojolicious'))
//    272 erb.js
registerLanguage('erb', require('highlight.js/lib/languages/erb'))
//    263 shell.js
registerLanguage('shell', require('highlight.js/lib/languages/shell'))
//    234 clojure-repl.js
registerLanguage('clojure-repl', require('highlight.js/lib/languages/clojure-repl'))
//    178 vbscript-html.js
registerLanguage('vbscript-html', require('highlight.js/lib/languages/vbscript-html'))
//     88 plaintext.js
registerLanguage('plaintext', require('highlight.js/lib/languages/plaintext'))
