'use strict';

var $ = window.$;
var _ = window._;
var Backbone = window.Backbone;
var MapView = window.MapView;
var RegionListView = window.RegionListView;
var RegionDetailsView = window.RegionDetailsView;
var StatsView = window.StatsView;
var PartnerModalView = window.PartnerModalView;

window.App = Backbone.View.extend({
    initialize: function() {
        this.mapView = null;
        this.regionListView = null;
        this.regionDetailsView = null;
        this.statsView = null;
        this.partnerModalView = null;

        this.emptyDetailsView = this.emptyDetailsView.bind(this);
        this.fadeInListView = this.fadeInListView.bind(this);
        this.animateDetailsViewReplacingList = this.animateDetailsViewReplacingList.bind(this);
        this.toggleDetails = this.toggleDetails.bind(this);
        this.slideOutStatsRegion = _.once(this.slideOutStatsRegion).bind(this);

        this.listenTo(this.model, 'change:detailsVisible', this.toggleDetails);
        this.listenToOnce(this.model, 'change:regionList', this.createRegionList);
        this.listenToOnce(this.model, 'change:baseMapTilesUrl', this.createMapView);
        this.listenToOnce(this.model, 'change:detailsVisible', this.slideOutStatsRegion);
        this.listenToOnce(this.model, 'change:statsList', this.createStatsView);
        this.listenToOnce(this.model, 'change:partnerModalLinks', this.createPartnerModalView);

        this.model.fetch();
        this.render();
    },

    render: function() {
        return this;
    },

    createMapView: function() {
        this.mapView = new MapView({
            model: this.model,
            slideOutStatsRegion: this.slideOutStatsRegion,
        });
        this.mapView.render();
    },

    createRegionList: function() {
        this.regionListView = new RegionListView({ model: this.model });
        this.regionListView.render();
    },

    createStatsView: function() {
        this.statsView = new StatsView({ model: this.model });
        this.statsView.render();
    },

    createPartnerModalView: function() {
        this.partnerModalView = new PartnerModalView({ model: this.model });
        this.partnerModalView.render();
    },

    emptyDetailsView: function() {
        this.regionDetailsView.$el.empty();
    },

    fadeInListView: function() {
        this.regionListView = new RegionListView({ model: this.model });
        this.regionListView.render();
        this.regionListView.$el.fadeIn(200);
    },

    animateDetailsViewReplacingList: function() {
        var self = this;
        var selectedRegion = this.model.get('selectedRegion').get('title');
        var listItems = $('#region-location-list').children();
        var $sidebarInnerEl = $('.sidebar--inner');
        var promise = $.Deferred();
        var $selectedListItem;

        promise.then(function() {
            self.regionListView.$el.hide();
            self.regionListView.$el.empty();
            self.regionDetailsView.render();
            self.regionDetailsView.$el.show();
        });

        $.each(listItems, function(index, listItem) {
            if (listItem.id !== selectedRegion) {
                // `delay` value is `200 * index` to stagger the fadeouts for
                // each list item rather than fading them all simultaneously.
                // `fadeTo` duration specifies that each fadeout will happen
                // over 300 ms rather than instantaneously.
                $(listItem).delay(200 * index).fadeTo(300, 0);
            } else {
                $selectedListItem = $(listItem);
            }
        });

        // If $selectedListItem's unset, toggle views without animating
        if (!$selectedListItem) {
            promise.resolve();
            return _.noop();
        }

        $selectedListItem
            .delay(listItems.length * 200)
            .queue(function(next) {
                var top = $sidebarInnerEl.offset().top - $selectedListItem.offset().top;
                $selectedListItem.animate({
                    top: top + 'px',
                    margin: '0 -3rem 0 -3rem'
                }, 500, promise.resolve).fadeOut(500);
                next();
            });

        // Returning a noop here to ensure that this function has the same
        // return type whether or not it executes the animation.
        return _.noop();
    },

    toggleDetails: function() {
        if (this.model.get('detailsVisible')) {
            this.regionDetailsView = new RegionDetailsView({
                model: this.model.get('selectedRegion'),
                hideDetails: this.model.hideDetails,
            });
            this.animateDetailsViewReplacingList();
        } else {
            this.regionDetailsView.$el.fadeOut(200);
            _.delay(this.emptyDetailsView, 200);
            _.delay(this.fadeInListView, 200);
        }
    },

    slideOutStatsRegion: function() {
        var self = this;

        if (this.statsView.$el && this.mapView.$el) {
            this.statsView.$el.addClass('slideout');
            this.mapView.$el.addClass('full-height');
            _.delay(function() {
                self.statsView.$el.hide();
                self.model.set('statsVisible', false);
                self.statsView.$el.empty();
            }, 500);
        }
    }
});
