'use strict';

var $ = window.$;
var L = window.L;
var _ = window._;
var Backbone = window.Backbone;

var MarkerPopupView = Backbone.View.extend({
    template: _.template($('#markerPopupTemplate').html()),

    render: function() {
        this.$el.html(this.template(this.model.attributes));

        return this;
    },
});

window.MapView = Backbone.View.extend({
    el: '#map',

    initialize: function(options) {
        this.map = null;
        this.slideOutStatsRegion = options.slideOutStatsRegion;
        this.listenTo(this.model.get('regionList'), 'change:selected', this.panBaseMap);
        this.listenTo(this.model.get('regionList'), 'change:selected', this.updateMarkers);
        this.listenTo(this.model.get('regionList'), 'change:selected', this.toggleSubregionMapEvents);
        this.markers = L.layerGroup();

        // Custom icon for markers
        this.icon = L.icon({
            iconUrl: 'assets/images/marker.png',
            iconSize: [25, 34]
        });
    },

    render: function() {
        var map = L.map('map', {
            center: this.model.get('initialMapCenter'),
            zoom: this.model.get('initialMapZoom'),
        });

        L.tileLayer(this.model.get('baseMapTilesUrl'), {
            attribution: this.model.get('baseMapTilesAttribution'),
            minZoom: this.model.get('baseMapTilesMinZoom'),
            maxZoom: this.model.get('baseMapTilesMaxZoom'),
            ext: 'png',
        }).addTo(map);

        L.esri.dynamicMapLayer({
            url: this.model.get('regionLayerUrl'),
            opacity: this.model.get('regionLayerOpacity'),
        }).addTo(map);

        this.map = map;
        this.map.once('moveend', this.slideOutStatsRegion);
        this.map.createPane('selectedMarker');

        return this;
    },

    toggleSubregionMapEvents: function(region) {
        if (region.get('selected')) {
            this.listenTo(region.get('subregions'), 'change:selected', this.panBaseMap);
        } else {
            this.stopListening(region.get('subregions'), 'change:selected', this.panBaseMap);
        }
    },

    panBaseMap: function() {
        var center = this.model.get('initialMapCenter');
        var zoom = this.model.get('initialMapZoom');

        if (this.model.getSelectedSubregion()) {
            center = this.model.getSelectedSubregion().get('mapCenter');
            zoom = this.model.getSelectedSubregion().get('mapZoom');
        } else if (this.model.getSelectedRegion()) {
            center = this.model.getSelectedRegion().get('mapCenter');
            zoom = this.model.getSelectedRegion().get('mapZoom');
        }

        this.map.flyTo(center, zoom);
    },

    updateMarkers: function() {
        var subregions = null;

        if (this.model.getSelectedRegion()) {
            subregions = this.model.getSelectedRegion().get('subregions');

            if (subregions && subregions.length > 0) {
                subregions.forEach(function(subregion) {
                    if (subregion.get('mapCenter')) {
                        this.markers.addLayer(this.createMarker(subregion));
                    }
                }, this);
            }

            this.map.addLayer(this.markers);
        } else {
            this.map.removeLayer(this.markers);
            this.markers.clearLayers();
        }
    },

    createMarker: function(subregion) {
        var offset = [0, 25]; // Marker is used as popup tip
        var popupContents = new MarkerPopupView({ model: subregion });
        var marker = L.marker(subregion.get('mapCenter'), { icon: this.icon })
            .bindPopup(popupContents.render().el, { offset: offset, maxHeight: 200 });

        this.assignMarkerEvents(marker, popupContents, subregion);

        return marker;
    },

    assignMarkerEvents: function(marker, popupContents, subregion) {
        var markerCopy = null;
        var self = this;

        // Adds a copy of the marker to the selectedMarker pane
        // so that it is displayed above the popup and acts as
        // the popup tip.
        marker.on('popupopen', function(e) {
            markerCopy = self.createMarkerCopy(e.target.getLatLng());
            markerCopy.addTo(self.map);
        });

        // Toggle the popup with the state of the sidebar
        subregion.on('change:selected', function() {
            self.togglePopup(subregion, marker);
        });

        // Marker used for popup tip is no longer needed
        marker.on('popupclose', function() {
            markerCopy.remove();
        });

        // Manually remove view to ensure there are no leaks
        marker.on('remove', function() {
            popupContents.remove();
        });
    },

    createMarkerCopy: function(latLng) {
        return L.marker(latLng, {
            pane: 'selectedMarker', icon: this.icon
        });
    },

    togglePopup: function(subregion, marker) {
        if (subregion.get('selected')) {
            marker.openPopup();
        } else {
            marker.closePopup();
        }
    }
});

window.RegionListView = Backbone.View.extend({
    el: '#region-list-view',

    template: _.template($('#regionListTemplate').html()),

    render: function() {
        this.$el.html(this.template({ }));

        this.$el.find('#region-list-items').html(this.model.get('regionList').map(function(region) {
            return new window.RegionListItemView({ model: region }).render().el;
        }));

        return this;
    }
});

window.RegionListItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'location',
    id: function() {
        return this.model.get('title');
    },

    template: _.template($('#regionListItemTemplate').html()),

    events: {
        'click': 'selectRegion',
    },

    render: function() {
        this.$el.html(this.template(this.model.attributes));

        return this;
    },

    selectRegion: function() {
        this.model.set('selected', true);
    },
});

window.RegionDetailsView = Backbone.View.extend({
    el: '#region-details-view',

    template: _.template($('#regionDetailsTemplate').html()),

    events: {
        'click #close-details-btn': 'closeDetails',
    },

    render: function() {
        var self = this;
        this.$el.html(this.template(this.model.attributes));

        this.$el.find('#subregion-list').html(this.model.get('subregions').map(function(subregion) {
            var view = new window.SubregionDetailsView({ model: subregion });

            self.listenTo(view, 'toggle', self.toggleSubregionDetails);

            return view.render().el;
        }));

        return this;
    },

    closeDetails: function() {
        this.model.set('selected', false);
        this.model.get('subregions').forEach(function(subregion) {
            subregion.set('selected', false);
        });
    },

    toggleSubregionDetails: function(subregionTitle) {
        var subregionSelector = "[data-title='" + subregionTitle + "']";
        var $description = this.$el.find(subregionSelector);

        // If a different subregion is open, close it and deselect it
        this.$el.find('.subregion.location--description:not(' + subregionSelector + '):visible').slideUp();
        this.model.get('subregions').forEach(function(subregion) {
            if (subregion.get('title') !== subregionTitle && subregion.get('selected')) {
                subregion.set('selected', false);
            }
        });

        // Toggle the description of the selected subregion
        $description.slideToggle();
    }
});

window.SubregionDetailsView = Backbone.View.extend({
    template: _.template($('#subregionDetailsTemplate').html()),

    events: {
        'click .location': 'toggleSelected',
    },

    render: function() {
        this.$el.html(this.template(this.model.attributes));

        return this;
    },

    toggleSelected: function() {
        this.model.set('selected', !this.model.get('selected'));

        this.trigger('toggle', this.model.get('title'));
    }
});

window.StatsView = Backbone.View.extend({
    el: '#stats-region',

    template: _.template($('#statsViewTemplate').html()),

    render: function() {
        var statsList = this.model.get('statsList');
        // To ensure the app always shows 3 and only 3 stat items, take the
        // first three configured stat items if the number's >= 3; if there are
        // fewer than 3 configured stat items, add up to 3 placeholders.
        var statItems = statsList.length >= 3 ? _.take(statsList, 3) :
            statsList.concat(_.map(_.range(statsList.length, 3), function() {
                return {
                    label: 'Label',
                    stat: 1,
                    secondaryLabel: 'secondaryLabel',
                    description: 'description',
                };
            }));

        this.$el.html(this.template({
            statItems: statItems,
        }));

        return this;
    },
});

window.PartnerModalView = Backbone.View.extend({
    el: '#partner-modal-region',

    template: _.template($('#partnerModalViewTemplate').html()),

    render: function() {
        this.$el.html(this.template({
            partnerLinks: this.model.get('partnerModalLinks'),
        }));

        return this;
    }
});
