<?php
/**
 *
 * 
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Myron Turner <turnermm02@shaw.ca>
 */

// Syntax: <color somecolour/somebackgroundcolour>
 
// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();
 
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'syntax.php');
 
/**
 * All DokuWiki plugins to extend the parser/rendering mechanism
 * need to inherit from this class
 */
class syntax_plugin_ckgedit_font extends DokuWiki_Syntax_Plugin {
 

 
    function getType(){ return 'formatting'; }
    function getAllowedTypes() { return array('formatting', 'substition', 'disabled'); }   
    function getSort(){ return 158; }
    function connectTo($mode) {
        $this->Lexer->addEntryPattern('<font\s*(?:(?!>).)*?>',$mode,'plugin_ckgedit_font');
        $this->Lexer->addSpecialPattern('~~CKG_TABLE_NBSP~~', $mode, 'plugin_ckgedit_font');
    }
    function postConnect() {
        $this->Lexer->addEntryPattern('<font\s*(?:(?!>).)*?>','plugin_ckgedit_font','plugin_ckgedit_font');
        $this->Lexer->addExitPattern('</font>','plugin_ckgedit_font');
    }
 
 
    /**
     * Handle the match
     */
    function handle($match, $state, $pos, Doku_Handler $handler){
        error_log("<font> handler: $match, $state, $pos");
        switch ($state) {
            case DOKU_LEXER_ENTER :
                list($size, $face) = preg_split("/\//u", substr($match, 6, -1), 2);
                if(isset($size) && strpos($size,':') !== false) {                        
                    list($size,$weight) = explode(':',$size);
                    if (isset($size) && $size !== 'inherit') {
                        $size = "font-size: $size; ";
                    } else {
                        $size = '';
                    }
                    if(isset($weight) && $weight) {
                        list($weight, $fstyle) = explode(',',$weight);                           
                        if (isset($weight) && $weight !== 'inherit') {
                            $size .= " font-weight: $weight;";
                        }
                        if (isset($fstyle) && $fstyle !== 'inherit') {
                            $size .= " font-style: $fstyle; ";
                        }
                    }
                }
                else if (isset($size) && $size !== 'inherit') {
                    $size = "font-size: $size;";
                } else {
                    $size = '';
                }
                return array($state, array($size, $face));
 
            case DOKU_LEXER_UNMATCHED :
                return array($state, $match);
            case DOKU_LEXER_EXIT :
                return array($state, '');
            case DOKU_LEXER_SPECIAL:
                if (preg_match('/~~CKG_TABLE_NBSP~~/', $match)) {
                    return array($state, "&nbsp;");
                }
                break;
        }
        return array();
    }
 
    /**
     * Create output
     */
    function render($mode, Doku_Renderer $renderer, $data) {
        if($mode == 'xhtml'){
            list($state, $param) = $data;

            switch ($state) {
                case DOKU_LEXER_ENTER :      
                    list($style, $face) = $param;
                    if(isset($face)) {
                        list($face,$fg,$bg) = explode(';;',$face);
                        if (isset($fg) && $fg !== 'inherit') {
                            $color = " color: $fg;";  
                            $style .= $color;
                        }
                        if (isset($bg) && $bg !== 'inherit') {
                            $color = " background-color: $bg;";  
                            $style .= $color;
                        }
                        if (isset($face) && $face !== 'inherit') {
                            $style = "font-family: $face; $style";
                        }
                    }
                    $style = trim($style);
                    $renderer->doc .= "<span style='$style'>"; 
                    break;
 
                case DOKU_LEXER_UNMATCHED :
                    $renderer->doc .= $renderer->_xmlEntities($param);
                    break;
                case DOKU_LEXER_EXIT :
                    $renderer->doc .= "</span>";
                    break;
                case DOKU_LEXER_SPECIAL:
                    $renderer->doc .= $param;
                    break;
            }
            return true;
        }
        return false;
    }
 
 
}
?>
