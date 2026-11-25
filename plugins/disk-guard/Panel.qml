pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Layouts
import QtQuick.Controls as Controls
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui as Ui

Ui.Panel {
    id: root
    moduleName: "local.disk-guard"
    ipcTarget: "local.disk-guard"
    property string helper: decodeURIComponent(Qt.resolvedUrl("disk_guard.py").toString().replace("file://", ""))
    property var snap: ({entries: [], disks: [], trash: [], categories: {}, review_bytes: 0, safe_stale_bytes: 0, trash_bytes: 0, scanned_at: 0, forecasts: {}})
    property var chosen: []
    property var trashChosen: []
    property var review: null
    property string mode: "files"
    property string category: "All"
    property string risk: "All risks"
    property string query: ""
    property string message: ""
    property bool staleOnly: false
    property bool scanning: false
    property bool busy: worker.running
    property bool initialized: false
    property string operation: ""
    readonly property var disk: snap.disks.length ? snap.disks[0] : ({percent: 0, available: 0, used: 0, total: 1, source: "", mount: "/"})
    readonly property color pressureColor: disk.percent >= 90 ? Color.urgent : disk.percent >= 80 ? Color.accent : Color.foreground
    readonly property var visibleEntries: snap.entries.filter(function(e) {
        return (category === "All" || e.category === category)
            && (risk === "All risks" || e.risk === risk)
            && (!staleOnly || e.age_days >= (root.snap.stale_days || 7))
            && (!query || (e.name + " " + e.path + " " + e.description).toLowerCase().indexOf(query.toLowerCase()) !== -1)
    })
    implicitWidth: pill.implicitWidth
    implicitHeight: pill.implicitHeight

    function fmt(n) {
        var units = ["B", "KiB", "MiB", "GiB", "TiB"]
        var i = 0
        while (n >= 1024 && i < 4) { n /= 1024; i++ }
        return n.toFixed(i > 1 ? 1 : 0) + " " + units[i]
    }
    function request(args) {
        if (worker.running) return
        operation = args[0]
        message = ""
        worker.command = ["python3", helper].concat(args)
        worker.running = true
    }
    function refresh() {
        if (!statusPoll.running) {
            statusPoll.command = ["python3", helper, "status"].concat(setting("notifications", true) ? ["--notify"] : [])
            statusPoll.running = true
        }
    }
    function scan() {
        if (busy) return
        review = null; chosen = []; mode = "files"; scanning = true
        request(["scan"])
    }
    function toggleId(id, trash) {
        var next = (trash ? trashChosen : chosen).slice()
        var i = next.indexOf(id)
        if (i < 0) next.push(id); else next.splice(i, 1)
        if (trash) trashChosen = next; else { chosen = next; review = null }
    }
    function inspect(path) { Quickshell.execDetached(["xdg-open", "file://" + encodeURI(path).replace(/#/g, "%23").replace(/\?/g, "%3F")]) }
    Component.onCompleted: refresh()
    onOpenedChanged: if (opened) refresh()
    Timer { interval: 60000; running: true; repeat: true; onTriggered: root.refresh() }
    Timer {
        interval: Math.max(1, root.setting("scanHours", 6)) * 3600000
        running: true; repeat: true
        onTriggered: if (!root.busy) root.scan()
    }
    Process {
        id: statusPoll
        stdout: StdioCollector {
            onStreamFinished: {
                try {
                    var value = JSON.parse(text)
                    if (value.error) { root.message = value.error; return }
                    root.snap = value
                    if (!root.initialized) {
                        root.initialized = true
                        if (!value.scanned_at || Date.now()/1000-value.scanned_at > root.setting("scanHours",6)*3600) root.scan()
                    }
                } catch(e) { root.message = "Disk monitor did not return valid data." }
            }
        }
        stderr: StdioCollector { onStreamFinished: if (text.trim()) root.message = text.trim().slice(-400) }
    }
    Process {
        id: worker
        stdout: StdioCollector {
            onStreamFinished: {
                root.scanning = false
                try {
                    var value = JSON.parse(text)
                    if (value.error) root.message = value.error
                    else if (root.operation === "preview") { root.review = value; confirmation.text = "" }
                    else if (root.operation === "scan") root.message = value.complete ? "Scan finished. Review items before cleaning." : "Partial scan: " + value.progress
                    else {
                        root.message = value.count + " item(s) " + (root.operation === "trash" ? "moved to Trash" : root.operation === "restore" ? "restored" : "permanently erased")
                            + ". Observed free-space change: " + root.fmt(value.observed_free_delta || 0)
                            + (value.errors && value.errors.length ? ". Stopped: " + value.errors[0].error : "")
                        root.chosen = []; root.trashChosen = []; root.review = null; confirmation.text = ""
                    }
                } catch(e) { root.message = "Action failed to return valid data; inspect the scan or Trash before retrying." }
                Qt.callLater(root.refresh)
            }
        }
        stderr: StdioCollector { onStreamFinished: if (text.trim()) root.message = text.trim().slice(-400) }
    }

    Ui.WidgetButton {
        id: pill
        anchors.fill: parent
        bar: root.bar
        text: "Disk " + Math.round(root.disk.percent) + "%"
        foreground: root.pressureColor
        tooltipText: root.fmt(root.disk.available) + " free · " + root.fmt(root.snap.safe_stale_bytes || 0) + " stale safe caches (estimate)"
        onPressed: root.toggle()
    }
    Ui.KeyboardPanel {
        id: popup
        anchorItem: pill
        owner: root
        bar: root.bar
        open: root.opened
        contentWidth: fittedContentWidth(Style.space(740))
        contentHeight: fittedContentHeight(Style.space(780))
        focusTarget: panelContent
        ColumnLayout {
            id: panelContent
            anchors.fill: parent
            spacing: Style.space(12)
            focus: true
            Keys.onEscapePressed: { if (root.review) root.review = null; else root.close() }
            RowLayout {
                Layout.fillHeight: false
                Layout.fillWidth: true
                ColumnLayout {
                    Layout.fillWidth: true
                    Label { text: "Disk Guard"; font.pixelSize: Style.font.title; font.bold: true }
                    Label { text: root.scanning ? "Scanning in the background…" : root.snap.scanned_at ? "Scanned " + new Date(root.snap.scanned_at*1000).toLocaleString() : "Ready to scan your developer artifacts"; font.pixelSize: Style.font.bodySmall; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                }
                Action { text: root.scanning ? "Scanning…" : "Rescan"; enabled: !root.busy; onClicked: root.scan() }
                Action { text: "Close"; onClicked: root.close() }
            }
            RowLayout {
                Layout.fillHeight: false
                Layout.fillWidth: true
                ColumnLayout {
                    Layout.fillWidth: true
                    Label { text: root.fmt(root.disk.available); font.pixelSize: Style.space(36); font.bold: true }
                    Label { text: "free on " + root.disk.mount + " · " + root.disk.percent.toFixed(0) + "% used" }
                }
                Item { Layout.fillWidth: true }
                ColumnLayout {
                    Label { text: root.fmt(root.snap.safe_stale_bytes || 0); font.pixelSize: Style.space(26); font.bold: true }
                    Label { text: "stale safe caches · estimate"; font.pixelSize: Style.font.bodySmall }
                }
            }
            Meter { Layout.fillWidth: true; value: root.disk.used / root.disk.total; fill: root.pressureColor }
            Label {
                visible: !!root.snap.forecasts[root.disk.source]
                text: "Usage trend: about " + (root.snap.forecasts[root.disk.source] || 0) + " days to full. Estimate from local history."
                Layout.fillWidth: true; wrapMode: Text.WordWrap
            }
            RowLayout {
                Layout.fillHeight: false
                Layout.fillWidth: true
                Repeater {
                    model: Object.keys(root.snap.categories || {}).sort((a,b) => root.snap.categories[b]-root.snap.categories[a]).slice(0,5)
                    delegate: ColumnLayout {
                        id: categoryCard
                        required property string modelData
                        Layout.fillWidth: true
                        Meter { Layout.fillWidth: true; value: root.snap.categories[categoryCard.modelData] / Math.max(1, root.snap.review_bytes + root.snap.entries.filter(e => e.blocked).reduce((n,e) => n+e.bytes,0)); fill: Color.accent }
                        Label { text: categoryCard.modelData + "\n" + root.fmt(root.snap.categories[categoryCard.modelData]); font.pixelSize: Style.font.bodySmall; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                    }
                }
            }
            RowLayout {
                Layout.fillHeight: false
                Layout.fillWidth: true
                Action { text: "Review files"; selected: root.mode === "files"; onClicked: {root.mode="files";root.review=null} }
                Action { text: "Plugin Trash · " + root.fmt(root.snap.trash_bytes || 0); selected: root.mode === "trash"; onClicked: {root.mode="trash";root.review=null;confirmation.text=""} }
                Item { Layout.fillWidth: true }
                Action { text: "Settings"; onClicked: root.inspect(Quickshell.env("HOME") + "/.config/disk-guard/config.json") }
            }
            Label {
                text: root.mode === "trash" ? "Trash remains recoverable and occupies disk space. Restore entries or explicitly erase them below."
                    : "Sizes are estimates. Shared Btrfs data and snapshots can retain blocks after deletion. Stale means no recent file modification."
                Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall
            }
            Label {
                visible: root.message !== ""
                text: root.message
                Layout.fillWidth: true; wrapMode: Text.WordWrap
                Accessible.role: Accessible.StaticText
                Accessible.name: text
            }
            Label {
                visible: !!root.snap.errors && root.snap.errors.length > 0
                text: root.snap.errors ? root.snap.errors.length + " paths skipped: " + root.snap.errors[0] : ""
                Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall
            }
            Label {
                visible: !root.snap.complete && !!root.snap.scanned_at && !root.scanning
                text: "Coverage is partial. " + (root.snap.progress || "Rescan to refresh.")
                Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall
            }
            RowLayout {
                Layout.fillHeight: false
                visible: root.mode === "files" && !root.review
                Layout.fillWidth: true
                Controls.TextField {
                    Layout.fillWidth: true
                    Layout.minimumWidth: 120
                    placeholderText: "Search paths, projects or caches"
                    Accessible.name: "Search scanned files"
                    palette.text: Color.foreground; palette.placeholderText: Color.foreground; palette.base: Color.background; palette.highlight: Color.accent
                    onTextChanged: root.query = text
                }
                Controls.ComboBox {
                    model: ["All"].concat(Object.keys(root.snap.categories || {}))
                    Accessible.name: "Filter by category"
                    palette.text: Color.foreground; palette.button: Color.background; palette.base: Color.background
                    onActivated: root.category = currentText
                }
                Controls.ComboBox {
                    model: ["All risks", "safe", "caution", "risky"]
                    Accessible.name: "Filter by risk"
                    palette.text: Color.foreground; palette.button: Color.background; palette.base: Color.background
                    onActivated: root.risk = currentText
                }
                Controls.CheckBox {
                    text: (root.snap.stale_days || 7) + "+ days"; palette.windowText: Color.foreground
                    Accessible.name: "Only files last modified at least seven days ago"
                    onToggled: root.staleOnly = checked
                }
            }
            Controls.ScrollView {
                visible: !root.review
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                ListView {
                    id: list
                    boundsBehavior: Flickable.StopAtBounds
                    clip: true
                    spacing: Style.space(8)
                    model: root.mode === "files" ? root.visibleEntries : root.snap.trash
                    delegate: Rectangle {
                        id: entryCard
                        required property var modelData
                        required property int index
                        width: list.width
                        implicitHeight: row.implicitHeight + Style.space(20)
                        color: Qt.rgba(Color.foreground.r,Color.foreground.g,Color.foreground.b,0.045)
                        radius: Style.cornerRadius
                        RowLayout {
                Layout.fillHeight: false
                            id: row
                            anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
                            anchors.margins: Style.space(10)
                            spacing: Style.space(10)
                            Controls.CheckBox {
                                enabled: !root.busy && !(entryCard.modelData.blocked || false)
                                checked: (root.mode === "trash" ? root.trashChosen : root.chosen).indexOf(entryCard.modelData.id) >= 0
                                Accessible.name: "Select " + (entryCard.modelData.name || entryCard.modelData.original)
                                palette.windowText: Color.foreground
                                onToggled: root.toggleId(entryCard.modelData.id,root.mode === "trash")
                            }
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: Style.space(3)
                                RowLayout {
                Layout.fillHeight: false
                                    Layout.fillWidth: true
                                    Label { text: root.mode === "trash" ? entryCard.modelData.original.split('/').pop() : entryCard.modelData.name; font.bold: true; Layout.fillWidth: true; elide: Text.ElideMiddle }
                                    Label { text: root.fmt(entryCard.modelData.bytes); font.bold: true }
                                }
                                Label { text: entryCard.modelData.path || entryCard.modelData.original; Layout.fillWidth: true; elide: Text.ElideMiddle; font.pixelSize: Style.font.bodySmall }
                                Label {
                                    visible: root.mode === "files"
                                    text: entryCard.modelData.description || ""
                                    Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall
                                }
                                Label {
                                    visible: root.mode === "files"
                                    text: (entryCard.modelData.risk || "").toUpperCase() + " · modified " + Math.floor(entryCard.modelData.age_days || 0) + " days ago"
                                        + (entryCard.modelData.blocked ? " · BLOCKED: " + entryCard.modelData.blocked : "")
                                        + (entryCard.modelData.note ? " · " + entryCard.modelData.note : "")
                                    Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall
                                    color: entryCard.modelData.risk === "risky" ? Color.urgent : Color.foreground
                                }
                            }
                            Action {
                                text: "Open"
                                onClicked: root.inspect(root.mode === "files" ? (entryCard.modelData.kind === "file" || entryCard.modelData.kind === "inspect" || entryCard.modelData.kind === "system-inspect" ? entryCard.modelData.path.substring(0,entryCard.modelData.path.lastIndexOf('/')) : entryCard.modelData.path) : (Quickshell.env("XDG_DATA_HOME") || Quickshell.env("HOME") + "/.local/share") + "/Trash/files/" + entryCard.modelData.name)
                            }
                        }
                    }
                    Controls.Label {
                        anchors.centerIn: parent
                        visible: list.count === 0
                        text: root.scanning ? "Scanning… results will appear shortly." : root.mode === "trash" ? "No files in Disk Guard's Trash." : "No matching artifacts. Try a rescan or a broader filter."
                        color: Color.foreground
                        width: parent.width - 30; wrapMode: Text.WordWrap; horizontalAlignment: Text.AlignHCenter
                    }
                }
            }
            Controls.ScrollView {
                visible: !!root.review
                Layout.fillWidth: true; Layout.fillHeight: true; clip: true
                ColumnLayout {
                    width: popup.contentWidth
                    spacing: Style.space(8)
                    Label { text: "Review " + (root.review ? root.review.entries.length : 0) + " items · " + root.fmt(root.review ? root.review.bytes : 0); font.bold: true }
                    Label { text: root.review ? root.review.message : ""; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                    Repeater {
                        model: root.review ? root.review.entries : []
                        delegate: ColumnLayout {
                            id: reviewCard
                            required property var modelData
                            Layout.fillWidth: true
                            Label { text: reviewCard.modelData.risk.toUpperCase() + " · " + root.fmt(reviewCard.modelData.bytes) + " · " + reviewCard.modelData.path; Layout.fillWidth: true; wrapMode: Text.WrapAnywhere }
                            Label { text: reviewCard.modelData.description; Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: Style.font.bodySmall }
                            Label { visible: !!(root.review && root.review.blocked[reviewCard.modelData.id]); text: root.review ? (root.review.blocked[reviewCard.modelData.id] || "") : ""; color: Color.urgent; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                            Ui.PanelSeparator { Layout.fillWidth: true }
                        }
                    }
                }
            }
            RowLayout {
                Layout.fillHeight: false
                visible: root.mode === "files" && !root.review
                Layout.fillWidth: true
                Label { text: root.chosen.length + " selected"; Layout.fillWidth: true }
                Action {
                    text: "Select stale safe items"; enabled: !root.busy
                    onClicked: root.chosen = root.visibleEntries.filter(e => !e.blocked && e.risk === "safe" && e.age_days >= (root.snap.stale_days || 7)).map(e => e.id)
                }
                Action { text: "Review selection"; enabled: !root.busy && root.chosen.length > 0; onClicked: root.request(["preview"].concat(root.chosen)) }
            }
            Label {
                visible: !!root.review || root.mode === "trash"
                text: root.review ? "Type " + root.review.phrase + " to confirm. This review expires after 10 minutes."
                    : "Permanent deletion: select entries and type EMPTY SELECTED TRASH. Only Disk Guard's selected entries are erased."
                Layout.fillWidth: true; wrapMode: Text.WordWrap
            }
            RowLayout {
                Layout.fillHeight: false
                visible: !!root.review || root.mode === "trash"
                Layout.fillWidth: true
                Controls.TextField {
                    id: confirmation
                    Layout.fillWidth: true
                    placeholderText: "Confirmation phrase"
                    Accessible.name: "Type the displayed confirmation phrase"
                    palette.text: Color.foreground; palette.placeholderText: Color.foreground; palette.base: Color.background; palette.highlight: Color.accent
                }
                Action {
                    visible: !!root.review
                    text: "Back"; enabled: !root.busy
                    onClicked: {root.review=null;confirmation.text=""}
                }
                Action {
                    visible: !!root.review
                    text: root.busy ? "Checking…" : "Move to Trash"
                    enabled: !root.busy && !!root.review && Object.keys(root.review.blocked).length === 0 && confirmation.text === root.review.phrase
                    onClicked: root.request(["trash", "--token", root.review.token, "--confirm", confirmation.text])
                }
                Action {
                    visible: root.mode === "trash"
                    text: "Restore"; enabled: !root.busy && root.trashChosen.length > 0
                    onClicked: root.request(["restore"].concat(root.trashChosen))
                }
                Action {
                    visible: root.mode === "trash"
                    text: "Erase selected"; foreground: Color.urgent
                    enabled: !root.busy && root.trashChosen.length > 0 && confirmation.text === "EMPTY SELECTED TRASH"
                    onClicked: root.request(["empty", "--confirm", confirmation.text].concat(root.trashChosen))
                }
            }
            Label { text: "Local only · no network requests · no automatic deletion"; font.pixelSize: Style.font.bodySmall; Layout.fillWidth: true }
        }
    }
    component Label: Controls.Label {
        color: Color.foreground
        font.family: Style.font.family
        font.pixelSize: Style.font.body
        textFormat: Text.PlainText
    }
    component Action: Ui.Button {
        focusable: true
        bordered: true
        opacity: enabled ? 1 : 0.45
        Accessible.role: Accessible.Button
        Accessible.name: text
    }
    component Meter: Rectangle {
        property real value: 0
        property color fill: Color.accent
        implicitHeight: Style.space(5)
        radius: 2
        color: Qt.rgba(Color.foreground.r,Color.foreground.g,Color.foreground.b,0.12)
        Rectangle { width: parent.width * Math.max(0,Math.min(1,parent.value)); height: parent.height; radius: parent.radius; color: parent.fill }
    }
}
