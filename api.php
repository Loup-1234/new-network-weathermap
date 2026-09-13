<?php
ob_start();

require_once __DIR__ . '/lib/all.php';

use Weathermap\Core\Map;
use Weathermap\Editor\Editor;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = !empty($rawInput) ? (json_decode($rawInput, true) ?? $_POST) : $_POST;

function getSafeConfigPath($mapName)
{
    $mapName = basename($mapName);
    if (file_exists(__DIR__ . '/configs/' . $mapName)) {
        return __DIR__ . '/configs/' . $mapName;
    }
    if (file_exists(__DIR__ . '/' . $mapName)) {
        return __DIR__ . '/' . $mapName;
    }
    return __DIR__ . '/configs/' . $mapName;
}

function hexToRgbStr($hex)
{
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $r = hexdec(str_repeat(substr($hex, 0, 1), 2));
        $g = hexdec(str_repeat(substr($hex, 1, 1), 2));
        $b = hexdec(str_repeat(substr($hex, 2, 1), 2));
    } elseif (strlen($hex) >= 6) {
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
    } else {
        return "192 192 192";
    }
    return "$r $g $b";
}

function serializeTopologyToConfig($topology)
{
    $lines = [];
    $meta = $topology['metadata'] ?? [];

    // Global Directives
    if (!empty($meta['background'])) {
        $lines[] = "BACKGROUND " . $meta['background'];
    }
    $width = !empty($meta['width']) ? (int)$meta['width'] : 800;
    $height = !empty($meta['height']) ? (int)$meta['height'] : 600;
    $lines[] = "WIDTH $width";
    $lines[] = "HEIGHT $height";

    if (!empty($meta['title'])) {
        $lines[] = "TITLE " . $meta['title'];
    }
    if (!empty($meta['htmlstyle'])) {
        $lines[] = "HTMLSTYLE " . $meta['htmlstyle'];
    }
    if (!empty($meta['arrowstyle'])) {
        $lines[] = "ARROWSTYLE " . $meta['arrowstyle'];
    }
    if (!empty($meta['linklabels'])) {
        $lines[] = "BWLABEL " . $meta['linklabels'];
    }
    if (!empty($meta['htmlfile'])) {
        $lines[] = "HTMLOUTPUTFILE " . $meta['htmlfile'];
    }
    if (!empty($meta['imagefile'])) {
        $lines[] = "IMAGEOUTPUTFILE " . $meta['imagefile'];
    }

    if (!empty($meta['nodefont'])) {
        $lines[] = "KEYFONT " . (int)$meta['nodefont'];
    }

    // Default Link bandwidth & width
    if (!empty($meta['default_link_bwin'])) {
        $bwin = $meta['default_link_bwin'];
        $bwout = $meta['default_link_bwout'] ?? $bwin;
        $lines[] = "SET default_link_bwin $bwin";
        $lines[] = "SET default_link_bwout $bwout";
    }
    if (!empty($meta['default_link_width'])) {
        $lines[] = "SET default_link_width " . (int)$meta['default_link_width'];
    }

    $lines[] = "";

    // Scales
    if (!empty($topology['scales'])) {
        foreach ($topology['scales'] as $scaleName => $scaleData) {
            if ($scaleName === 'none') continue;
            if (!empty($scaleData['entries'])) {
                foreach ($scaleData['entries'] as $entry) {
                    $b = $entry['bottom'] ?? 0;
                    $t = $entry['top'] ?? 100;
                    $c1 = hexToRgbStr($entry['color1'] ?? '#3b82f6');
                    if (!empty($entry['color2'])) {
                        $c2 = hexToRgbStr($entry['color2']);
                        $lines[] = "SCALE $scaleName $b $t $c1 $c2";
                    } else {
                        $lines[] = "SCALE $scaleName $b $t $c1";
                    }
                }
            }
        }
        $lines[] = "";
    }

    // Nodes
    if (!empty($topology['nodes'])) {
        foreach ($topology['nodes'] as $node) {
            $nodeId = $node['id'] ?? 'node';
            $lines[] = "NODE $nodeId";
            $lbl = !empty($node['raw_label']) ? $node['raw_label'] : ($node['label'] ?? '');
            if (!empty($lbl)) {
                $lines[] = "\tLABEL " . $lbl;
            }
            if (isset($node['hide_label']) && $node['hide_label']) {
                $lines[] = "\tSET hide_label 1";
            }
            if (!empty($node['labeloffset'])) {
                $lines[] = "\tLABELOFFSET " . $node['labeloffset'];
            } elseif (isset($node['labeloffsetx']) || isset($node['labeloffsety'])) {
                $lox = (int)($node['labeloffsetx'] ?? 0);
                $loy = (int)($node['labeloffsety'] ?? 0);
                if ($lox !== 0 || $loy !== 0) {
                    $lines[] = "\tLABELOFFSET $lox $loy";
                }
            }
            if (!empty($node['icon']) && $node['icon'] !== 'none') {
                $lines[] = "\tICON " . $node['icon'];
            }
            if (!empty($node['target'])) {
                $lines[] = "\tTARGET " . $node['target'];
            }
            if (!empty($node['infourl'])) {
                $lines[] = "\tINFOURL " . $node['infourl'];
            }
            if (!empty($node['hover']) || !empty($node['overliburl'])) {
                $lines[] = "\tOVERLIBGRAPH " . ($node['hover'] ?? $node['overliburl']);
            }
            $x = round($node['x'] ?? 0);
            $y = round($node['y'] ?? 0);
            if (!empty($node['lock_to'])) {
                $lines[] = "\tPOSITION " . $node['lock_to'] . " $x $y";
            } else {
                $lines[] = "\tPOSITION $x $y";
            }
            $lines[] = "";
        }
    }

    // Links
    if (!empty($topology['links'])) {
        foreach ($topology['links'] as $link) {
            $linkId = $link['id'] ?? 'link';
            $src = $link['source'] ?? '';
            $dst = $link['target'] ?? '';
            if (empty($src) || empty($dst)) continue;

            $lines[] = "LINK $linkId";
            $lines[] = "\tNODES $src $dst";

            if (!empty($link['target_ds'])) {
                $lines[] = "\tTARGET " . $link['target_ds'];
            }

            $bwin = $link['bandwidth_in_cfg'] ?? '100M';
            $bwout = $link['bandwidth_out_cfg'] ?? $bwin;
            $lines[] = "\tBANDWIDTH $bwin $bwout";

            if (!empty($link['width'])) {
                $lines[] = "\tWIDTH " . (int)$link['width'];
            }

            if (!empty($link['comments']['in'])) {
                $lines[] = "\tINCOMMENT " . $link['comments']['in'];
            }
            if (!empty($link['comments']['out'])) {
                $lines[] = "\tOUTCOMMENT " . $link['comments']['out'];
            }
            if (isset($link['hide_labels']) && $link['hide_labels']) {
                $lines[] = "\tSET hide_labels 1";
            }

            if (isset($link['commentpos_in'])) {
                $inPos = (int)$link['commentpos_in'];
                $outPos = isset($link['commentpos_out']) ? (int)$link['commentpos_out'] : (100 - $inPos);
                $lines[] = "\tCOMMENTPOS $inPos $outPos";
            }

            if (!empty($link['infourl'])) {
                if (is_array($link['infourl'])) {
                    if (!empty($link['infourl']['in'])) $lines[] = "\tINFOURL " . $link['infourl']['in'];
                } else {
                    $lines[] = "\tINFOURL " . $link['infourl'];
                }
            }
            if (!empty($link['hover']) || !empty($link['overliburl'])) {
                $hover = $link['hover'] ?? $link['overliburl'];
                if (is_array($hover)) {
                    if (!empty($hover['in'])) $lines[] = "\tOVERLIBGRAPH " . $hover['in'];
                } else {
                    $lines[] = "\tOVERLIBGRAPH " . $hover;
                }
            }

            if (!empty($link['via']) && is_array($link['via'])) {
                foreach ($link['via'] as $v) {
                    $vx = round($v[0]);
                    $vy = round($v[1]);
                    $lines[] = "\tVIA $vx $vy";
                }
            }
            $lines[] = "";
        }
    }

    return implode("\n", $lines) . "\n";
}


function sendJsonResponse($data, $statusCode = 200) {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    switch ($action) {
        case 'list_maps':
            $maps = [];
            $dirs = [__DIR__, __DIR__ . '/configs'];
            foreach ($dirs as $dir) {
                if (!is_dir($dir)) continue;
                $files = glob($dir . '/*.conf');
                foreach ($files as $file) {
                    $base = basename($file);
                    $title = $base;
                    $handle = @fopen($file, 'r');
                    if ($handle) {
                        while (($line = fgets($handle)) !== false) {
                            if (preg_match('/^\s*TITLE\s+(.*)$/i', $line, $m)) {
                                $title = trim($m[1]);
                                break;
                            }
                        }
                        fclose($handle);
                    }
                    $maps[$base] = [
                        'name' => $base,
                        'path' => $base,
                        'title' => $title,
                        'writable' => is_writable($file),
                        'modified' => filemtime($file),
                    ];
                }
            }
            sendJsonResponse(['success' => true, 'maps' => array_values($maps)]);
            break;

        case 'create_map':
            $mapName = basename($input['map'] ?? $input['new_name'] ?? 'new_map.conf');
            if (!preg_match('/\.conf$/i', $mapName)) {
                $mapName .= '.conf';
            }
            $path = __DIR__ . '/configs/' . $mapName;
            $sourceMap = $input['source_map'] ?? $input['copy_from'] ?? null;

            if ($sourceMap) {
                $sourcePath = getSafeConfigPath($sourceMap);
                if (file_exists($sourcePath)) {
                    copy($sourcePath, $path);
                    sendJsonResponse(['success' => true, 'message' => "Carte '$mapName' clonée avec succès.", 'map' => $mapName]);
                    exit;
                }
            }

            // Default minimal template
            $defaultConf = "WIDTH 800\nHEIGHT 600\nTITLE Nouvelle Carte Weathermap\nHTMLSTYLE overlib\nBWLABEL percent\n\n" .
                "SCALE DEFAULT 0 0 255 255 255\n" .
                "SCALE DEFAULT 0 1 140 0 255\n" .
                "SCALE DEFAULT 1 10 32 32 255\n" .
                "SCALE DEFAULT 10 25 0 192 255\n" .
                "SCALE DEFAULT 25 40 0 240 0\n" .
                "SCALE DEFAULT 40 55 240 240 0\n" .
                "SCALE DEFAULT 55 70 255 192 0\n" .
                "SCALE DEFAULT 70 85 255 96 0\n" .
                "SCALE DEFAULT 85 100 255 0 0\n\n";

            file_put_contents($path, $defaultConf);
            sendJsonResponse(['success' => true, 'message' => "Nouvelle carte '$mapName' créée.", 'map' => $mapName]);
            break;

        case 'load_map':
            $mapName = $_GET['map'] ?? $input['map'] ?? 'weathermap.conf';
            $path = getSafeConfigPath($mapName);
            if (!file_exists($path)) {
                http_response_code(404);
                sendJsonResponse(['success' => false, 'error' => "Config file '$mapName' not found."]);
                exit;
            }

            $map = new Map();
            $map->context = 'editor';
            $map->readConfig($path);
            $map->readData();
            $topology = $map->exportTopology();
            $topology['metadata']['filename'] = basename($path);

            sendJsonResponse(['success' => true, 'topology' => $topology]);
            break;

        case 'save_map':
            $mapName = $input['map'] ?? 'weathermap.conf';
            $path = getSafeConfigPath($mapName);
            $rawConfig = $input['config'] ?? null;
            $topology = $input['topology'] ?? null;

            if ($rawConfig !== null) {
                file_put_contents($path, $rawConfig);
                sendJsonResponse(['success' => true, 'message' => "Sauvegarde réussie dans $mapName."]);
                exit;
            }

            if ($topology !== null) {
                $serialized = serializeTopologyToConfig($topology);
                file_put_contents($path, $serialized);
                sendJsonResponse(['success' => true, 'message' => "Topologie enregistrée dans $mapName."]);
                exit;
            }

            sendJsonResponse(['success' => true]);
            break;

        case 'get_raw_config':
        case 'raw_config':
            $mapName = $_GET['map'] ?? $input['map'] ?? 'weathermap.conf';
            $path = getSafeConfigPath($mapName);
            if (!file_exists($path)) {
                http_response_code(404);
                sendJsonResponse(['success' => false, 'error' => "Config '$mapName' not found."]);
                exit;
            }
            $rawCfg = file_get_contents($path);
            sendJsonResponse(['success' => true, 'config' => $rawCfg, 'content' => $rawCfg]);
            break;

        case 'save_raw_config':
            $mapName = $input['map'] ?? $_GET['map'] ?? 'weathermap.conf';
            $path = getSafeConfigPath($mapName);
            $rawCfg = $input['content'] ?? $input['config'] ?? null;
            if ($rawCfg === null) {
                sendJsonResponse(['success' => false, 'error' => "Aucun contenu reçu pour la sauvegarde."]);
                exit;
            }
            file_put_contents($path, $rawCfg);
            sendJsonResponse(['success' => true, 'message' => "Configuration sauvegardée dans $mapName."]);
            break;

        case 'list_images':
            $imagesDir = __DIR__ . '/images';
            $icons = [];
            $backgrounds = [];

            if (is_dir($imagesDir)) {
                $files = scandir($imagesDir);
                foreach ($files as $file) {
                    if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'gif', 'svg'])) {
                        $fullPath = $imagesDir . '/' . $file;
                        $size = @getimagesize($fullPath);
                        $item = [
                            'name' => $file,
                            'url' => '/images/' . $file,
                            'width' => $size ? $size[0] : 0,
                            'height' => $size ? $size[1] : 0,
                        ];
                        $icons[] = $item;
                        if ($size && $size[0] >= 80 && $size[1] >= 80) {
                            $backgrounds[] = $item;
                        }
                    }
                }
            }

            sendJsonResponse([
                'success' => true,
                'icons' => $icons,
                'backgrounds' => $backgrounds,
            ]);
            break;

        default:
            sendJsonResponse(['success' => false, 'error' => "Unknown action '$action'"]);
            break;
    }
} catch (\Throwable $e) {
    http_response_code(500);
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()]);
}
