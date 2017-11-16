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

    panBaseMap: function() {
        var center = this.model.get('initialMapCenter');
        var zoom = this.model.get('initialMapZoom');

        if (this.model.getSelectedRegion()) {
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
            .bindPopup(popupContents.render().el, { offset: offset });
        var markerCopy = null;

        // Adds a copy of the marker to the selectedMarker pane
        // so that it is displayed above the popup and acts as
        // the popup tip.
        marker.on('popupopen', _.bind(function(e) {
            markerCopy = L.marker(e.target.getLatLng(), {
                pane: 'selectedMarker', icon: this.icon
            });
            markerCopy.addTo(this.map);
        }, this));

        marker.on('popupclose', function() {
            markerCopy.remove();
        });

        marker.on('remove', function() {
            popupContents.remove();
        });

        return marker;
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
            return new window.SubregionDetailsView({ model: subregion }).render().el;
        }));

        return this;
    },

    closeDetails: function() {
        this.model.set('selected', false);
    }
});

window.SubregionDetailsView = Backbone.View.extend({
    tagName: 'div',
    className: 'location',

    template: _.template($('#subregionDetailsTemplate').html()),

    render: function() {
        this.$el.html(this.template(this.model.attributes));

        return this;
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
