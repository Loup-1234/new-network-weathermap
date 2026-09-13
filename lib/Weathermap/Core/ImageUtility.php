<?php

namespace Weathermap\Core;

/**
 * Utility functions related to manipulating GD images
 *
 * @package Weathermap\Core
 */
class ImageUtility
{
    /**
     * @param $boxWidth
     * @param $boxHeight
     * @return resource|null
     */
    public static function createTransparentImage($boxWidth, $boxHeight)
    {
        if (!function_exists('imagecreatetruecolor')) {
            return null;
        }

        $w = max(1, (int)$boxWidth);
        $h = max(1, (int)$boxHeight);
        $gdScaleImage = imagecreatetruecolor($w, $h);

        if (!$gdScaleImage) {
            return null;
        }

        // Start with a transparent box, in case the fill or outline colour is 'none'
        if (function_exists('imagesavealpha')) {
            imagesavealpha($gdScaleImage, true);
        }
        if (function_exists('imagecolorallocatealpha')) {
            $nothing = imagecolorallocatealpha($gdScaleImage, 128, 0, 0, 127);
            if ($nothing !== false && function_exists('imagefill')) {
                imagefill($gdScaleImage, 0, 0, $nothing);
            }
        }

        return $gdScaleImage;
    }

    public static function myImageColorAllocate($imageRef, $red, $green, $blue)
    {
        if (!$imageRef || !function_exists('imagecolorexact')) {
            return false;
        }
        $c = imagecolorexact($imageRef, (int)$red, (int)$green, (int)$blue);
        if ($c === -1) {
            $c = imagecolorallocate($imageRef, (int)$red, (int)$green, (int)$blue);
            if ($c === -1 || $c === false) {
                $c = imagecolorclosest($imageRef, (int)$red, (int)$green, (int)$blue);
            }
        }
        return $c;
    }

    public static function drawMarkerCross($gdImage, $colour, $point, $size = 5)
    {
        if (!$gdImage || !function_exists('imageline')) {
            return;
        }
        $x = $point[0];
        $y = $point[1];

        imageline($gdImage, $x - $size, $y, $x + $size, $y, $colour);
        imageline($gdImage, $x, $y - $size, $x, $y + $size, $colour);
    }
}
