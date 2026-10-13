(function ($) {
    "use strict";

    function getParameter(name) {
        var query = window.location.search.substring(1);
        var parts = query.split("&");

        for (var i = 0; i < parts.length; i++) {
            var pair = parts[i].split("=");

            if (decodeURIComponent(pair[0].replace(/\+/g, " ")) === name) {
                return decodeURIComponent(
                    (pair.slice(1).join("=")).replace(/\+/g, " ")
                );
            }
        }

        return null;
    }

    function addRow(list, content) {
        $("<li>").append(content).appendTo(list);
    }

    function addLink(list, name, url, iconClass) {
        if (!name || !url) {
            return;
        }

        var link = $("<a>")
            .attr("href", url)
            .attr("role", "button")
            .text(name);

        if (iconClass) {
            link.prepend(
                $("<span>")
                    .addClass(iconClass)
                    .attr("aria-hidden", "true")
            );
        }

        addRow(list, link);
    }

    function getText(parent, selector) {
        return $(parent).children(selector).first().text().trim();
    }

    function showError() {
        $("#packageInformation").hide();
        $("#packageError").show();
    }

    function hideIfEmpty(header, list) {
        if (!$(list).children().length) {
            $(header).hide();
            $(list).hide();
        }
    }

    window.loadPackage = function () {
        var bundleid = getParameter("p");

        if (!bundleid ||
            !/^[a-zA-Z0-9._-]+$/.test(bundleid)) {
            showError();
            return;
        }

        $.ajax({
            url: bundleid + "/info.xml",
            type: "GET",
            dataType: "xml",
            cache: false
        }).done(function (xml) {
            var $xml = $(xml);
            var $package = $xml.find("package").first();

            if (!$package.length) {
                showError();
                return;
            }

            var name = getText($package, "name");
            var version = getText($package, "version");
            var shortDescription = getText($package, "shortDescription");

            document.title = name || "Package";

            $("#packageName").text(name || "Package");
            $("#packageShortDesc").text(shortDescription);

            if (!shortDescription) {
                $("#packageShortDesc").hide();
            }

            $("#versionBadge").text(version);

            var $firmware = $package
                .children("compatibility")
                .children("firmware");

            var minIOS = getText($firmware, "miniOS");
            var maxIOS = getText($firmware, "maxiOS");
            var otherVersions = getText($firmware, "otherVersions");

            var $compatibilityHeader = $("#compatibilityHeader");
            var $compatibilityList = $("#compatibilityList");
            var $compatibilityCheck = $("#compatibilityCheck");

            if (minIOS) {
                ios_version_check(
                    minIOS,
                    maxIOS,
                    otherVersions,
                    function (message, isBad, status) {
                        var $lights = $("<span>")
                            .addClass("status-lights")
                            .attr("aria-hidden", "true");

                        for (var i = 0; i < 3; i++) {
                            $lights.append(
                                $("<span>").addClass("status-light")
                            );
                        }

                        $compatibilityCheck
                            .empty()
                            .removeClass(
                                "status-supported status-unconfirmed " +
                                "status-needs-upgrade status-unsupported " +
                                "status-unknown"
                            )
                            .addClass("compatibility-status")
                            .addClass("status-" + status)
                            .append($lights)
                            .append(
                                $("<span>")
                                    .addClass("compatibility-message")
                                    .text(message)
                            )
                            .show();

                        $compatibilityHeader.show();
                        $compatibilityList.show();
                    }
                );
            } else {
                $compatibilityHeader.hide();
                $compatibilityList.hide();
            }

            var $descriptionList = $("#descriptionList");
            var $descriptions = $package
                .children("descriptionlist")
                .children("description");

            $descriptions.each(function () {
                addRow(
                    $descriptionList,
                    $("<p>").text($(this).text().trim())
                );
            });

            var $screenshots = $package
                .children("screenshots")
                .children("screenshot");

            if ($screenshots.length) {
                addRow(
                    $descriptionList,
                    $("<a>")
                        .attr("href",
                            "screenshots.html?p=" +
                            encodeURIComponent(bundleid))
                        .attr("role", "button")
                        .text("Screenshots")
                );
            }

            hideIfEmpty("#descriptionHeader", $descriptionList);

            var $changesList = $("#changesList");
            var $changes = $package
                .children("changelog")
                .children("change");

            $changes.each(function () {
                addRow(
                    $changesList,
                    $("<p>").text($(this).text().trim())
                );
            });

            hideIfEmpty("#versionHeader", $changesList);

            if ($changes.length) {
                $("#changelogLink").attr(
                    "href",
                    "changelog.html?p=" + encodeURIComponent(bundleid)
                );
            } else {
                $("#changelogHeader, #changelogList").hide();
            }

            var $dependencyList = $("#dependencyList");
            var $dependencies = $package.children("dependencies");

            var dependencyIDs = [];

            $dependencies.children("package").each(function () {
                var id = $(this).text().trim();
                if (id) dependencyIDs.push(id);
            });

            if (!$dependencies.children("package").length) {
                var dependencyText = $dependencies.text().trim();

                if (dependencyText) {
                    dependencyIDs = dependencyText
                        .split(/[\s,]+/)
                        .filter(Boolean);
                }
            }

            dependencyIDs.forEach(function (id) {
                var link = $("<a>")
                    .attr("href", id + "/info.xml")
                    .attr("role", "button")
                    .text(id);

                addRow($dependencyList, link);
            });

            hideIfEmpty("#dependenciesHeader", $dependencyList);

            var $externalList = $("#externalLinksList");
            var $links = $package.children("links").children("link");

            $links.each(function () {
                var name = getText(this, "name");
                var url = getText(this, "url");
                var iconClass = getText(this, "iconclass");

                addLink($externalList, name, url, iconClass);
            });

            hideIfEmpty("#externalLinksHeader", $externalList);

            var $contactList = $("#repoFooterLinks");
            var $contact = $package.children("contact");

            $contact.children("link").each(function () {
                addLink(
                    $contactList,
                    getText(this, "name"),
                    getText(this, "url"),
                    getText(this, "iconclass")
                );
            });

            hideIfEmpty("#contactHeader", $contactList);

        }).fail(function () {
            showError();
        });
    };

})(jQuery);