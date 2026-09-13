<?php

namespace Weathermap\Core;

/**
 * FontTable member representing a GD format bitmap font
 *
 * @package Weathermap\Core
 */
class GDFont extends Font
{
    public $gdnumber;

    /**
     * WMGDFont constructor.
     * @param int|string $filename
     */
    public function __construct($filename)
    {
        parent::__construct();

        if (is_numeric($filename)) {
            $this->loaded = $this->initGDBuiltin(intval($filename));
        } else {
            $this->loaded = $this->initGD($filename);
        }
    }

    public function drawImageString($gdImage, $x, $y, $string, $colour, $angle = 0)
    {
        $fontHeight = function_exists('imagefontheight') ? imagefontheight($this->gdnumber) : 12;
        if (function_exists('imagestring')) {
            imagestring($gdImage, $this->gdnumber, (int)$x, (int)($y - $fontHeight), $string, $colour);
        }
        if ($angle != 0) {
            MapUtility::warn("Angled text doesn't work with non-FreeType fonts [WMWARN02]\n");
        }
    }

    public function getConfig($fontNumber)
    {
        if ($fontNumber < 6) {
            return '';
        }
        return sprintf("FONTDEFINE %d %s\n", $fontNumber, $this->file);
    }

    public function calculateImageStringSize($string)
    {
        $lines = explode("\n", $string);
        $lineCount = count($lines);
        $maxLineLength = $this->calculateMaxLineLength($lines);

        $fontWidth = function_exists('imagefontwidth') ? imagefontwidth($this->gdnumber) : 7;
        $fontHeight = function_exists('imagefontheight') ? imagefontheight($this->gdnumber) : 12;

        return array($fontWidth * $maxLineLength, $lineCount * $fontHeight);
    }

    private function initGDBuiltin($gdNumber)
    {
        $this->gdnumber = $gdNumber;
        $this->type = 'GD builtin';

        return true;
    }

    /**
     * @param string $filename
     * @return bool
     */
    private function initGD($filename)
    {
        if (function_exists('imageloadfont')) {
            $gdFontID = imageloadfont($filename);

            if ($gdFontID) {
                $this->gdnumber = $gdFontID;
                $this->file = $filename;
                $this->type = 'gd';

                return true;
            }
        }
        return false;
    }

    public function asConfigData($fontNumber)
    {
        return array(
            'number' => $fontNumber,
            'type' => $this->type,
            'file' => $this->file
        );
    }
}
