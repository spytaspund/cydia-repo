/*
 * Based on Lotus - iosver.js
 * Copyright (C) 2014-2015 Timon Olsthoorn
 *
 * Original license: BSD 3-Clause.
 */

var VERSION_CHECK_SUPPORTED =
    "Your iOS version is supported!";

var VERSION_CHECK_NEEDS_UPGRADE =
    "Requires at least iOS %s";

var VERSION_CHECK_UNCONFIRMED =
    "Not yet tested on iOS %s";

var VERSION_CHECK_UNSUPPORTED =
    "Only compatible with iOS %s to %s";

var VERSION_CHECK_UNKNOWN =
    "Could not determine your iOS version.";

function ios_version_check(minIOS, maxIOS, otherIOS, callback) {
    "use strict";

    function parseVersionString(version) {
        var bits = String(version || "0").split(".");

        return [
            parseInt(bits[0], 10) || 0,
            parseInt(bits[1], 10) || 0,
            parseInt(bits[2], 10) || 0
        ];
    }

    function compareVersions(one, two) {
        for (var i = 0; i < 3; i++) {
            var a = one[i] || 0;
            var b = two[i] || 0;

            if (a > b) return 1;
            if (a < b) return -1;
        }

        return 0;
    }

    function finish(message, isBad, status, result) {
        if (typeof callback === "function") {
            callback(message, isBad, status);
        }

        return result;
    }

    var appVersion = navigator.appVersion || "";
    var match = appVersion.match(
        /CPU(?: iPhone)? OS (\d+)_(\d+)(?:_(\d+))? like/i
    );

    if (!match) {
        return finish(VERSION_CHECK_UNKNOWN, false, "unknown", 0);
    }

    var osVersion = [
        parseInt(match[1], 10),
        parseInt(match[2], 10),
        parseInt(match[3] || "0", 10)
    ];

    var osString = osVersion[0] + "." + osVersion[1];

    if (osVersion[2]) {
        osString += "." + osVersion[2];
    }

    var minString = String(minIOS || "0");
    var maxString = String(maxIOS || "");

    var minVersion = parseVersionString(minString);
    var maxVersion = maxString
        ? parseVersionString(maxString)
        : null;

    if (compareVersions(minVersion, osVersion) > 0) {
        return finish(
            VERSION_CHECK_NEEDS_UPGRADE.replace("%s", minString),
            true,
            "needs-upgrade",
            -1
        );
    }

    if (
        maxVersion &&
        compareVersions(maxVersion, osVersion) < 0
    ) {
        if (otherIOS === "unsupported") {
            return finish(
                VERSION_CHECK_UNSUPPORTED
                    .replace("%s", minString)
                    .replace("%s", maxString),
                true,
                "unsupported",
                -1
            );
        }

        return finish(
            VERSION_CHECK_UNCONFIRMED.replace("%s", osString),
            true,
            "unconfirmed",
            -1
        );
    }

    return finish(
        VERSION_CHECK_SUPPORTED,
        false,
        "supported",
        1
    );
}