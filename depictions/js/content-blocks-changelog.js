
(function ($) {
    "use strict";

    function getParameter(name) {
        var parts = window.location.search.substring(1).split("&");

        for (var i = 0; i < parts.length; i++) {
            var pair = parts[i].split("=");

            if (decodeURIComponent(pair[0].replace(/\+/g, " ")) === name) {
                return decodeURIComponent(
                    pair.slice(1).join("=").replace(/\+/g, " ")
                );
            }
        }

        return null;
    }

    function showError() {
        $("#packageInformation").hide();
        $("#packageError").show();
    }

    function getText(element, selector) {
        return $(element).children(selector).first().text().trim();
    }

    function addRelease(version, changes) {
        var $content = $("#changelogContent");

        $("<h2>")
            .attr("role", "header")
            .text(version ? "Version " + version : "Changes")
            .appendTo($content);

        var $list = $("<ul>").appendTo($content);

        changes.each(function () {
            var change = $(this).text().trim();

            if (change) {
                $("<li>")
                    .append($("<p>").text(change))
                    .appendTo($list);
            }
        });

        if (!$list.children().length) {
            $list.prev("h2").remove();
            $list.remove();
        }
    }

    function loadRepositoryLinks() {
        $.ajax({
            url: "../repo.xml",
            type: "GET",
            dataType: "xml",
            cache: false
        }).done(function (xml) {
            var $list = $("#repoFooterLinks");
            var $links = $(xml).find("repo > footerlinks > link");

            $links.each(function () {
                var name = getText(this, "name");
                var url = getText(this, "url");

                if (!name || !url) return;

                $("<li>")
                    .append(
                        $("<a>")
                            .attr("href", url)
                            .attr("role", "button")
                            .text(name)
                    )
                    .appendTo($list);
            });

            if (!$list.children().length) {
                $("#contactInfo").hide();
            }
        }).fail(function () {
            $("#contactInfo").hide();
        });
    }

    window.loadChangelog = function () {
        var bundleid = getParameter("p");

        if (!bundleid || !/^[a-zA-Z0-9._-]+$/.test(bundleid)) {
            showError();
            return;
        }

        $.ajax({
            url: bundleid + "/changelog.xml",
            type: "GET",
            dataType: "xml",
            cache: false
        }).done(function (xml) {
            var $xml = $(xml);
            var $changelog = $xml.find("changelog").first();

            if (!$changelog.length) {
                showError();
                return;
            }

            var $content = $("#changelogContent");
            $content.empty();

            var $releases = $changelog.children("changes");

            $releases.each(function () {
                var version = getText(this, "version");
                var $changes = $(this).children("change");

                addRelease(version, $changes);
            });

            if (!$content.children("h2").length) {
                showError();
                return;
            }

            var packageName = $xml.find("package > name").first().text().trim();

            if (packageName) {
                $("#packageName").text(packageName);
                $("#packageSubtitle").text("Release History");
                document.title = packageName + " — Changelog";
            }

            loadRepositoryLinks();
        }).fail(function () {
            showError();
        });
    };

})(jQuery);
