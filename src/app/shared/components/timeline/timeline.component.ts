import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AssetsService } from 'app/services/assets.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JsonPreviewComponent } from 'app/shared/components/json-preview/json-preview.component';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  events;
  json;
  perPage = 25;
  // Pagination
  currentEventsPage = 1;
  totalEventsPages = 0;
  resultCountEvents;
  currentSearchPage = 1;
  totalSearchPages = 0;
  resultCountSearch;
  eventsActive = true;
  searchActive = false;
  pagination = [];
  searchPlaceholder = 'ie. sold';
  showSearch = false;

  @Input() data;
  @Input() assetId;
  @Input() name;

  constructor(private assets: AssetsService, private el: ElementRef, public dialog: MatDialog) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(JsonPreviewComponent, {
      width: '600px',
      position: { right: '0'}
    });
    const instance = dialogRef.componentInstance;
    instance.data = this.json;
    instance.name = this.name;
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  ngOnInit() {
    // Bind this for pagination
    this.loadEvents = this.loadEvents.bind(this);
    this.search = this.search.bind(this);

    this.loadEvents(0);
  }

  bulkActions(action) {
    switch (action.value) {
      case 'exportEvents':
        this.openDialog();
        break;
    }

    action.value = 'default';
  }

  paginationGenerate(currentPage, pageCount) {
    const delta = 2,
      left = currentPage - delta,
      right = currentPage + delta + 1;
    let result = [];

    result = Array.from({ length: pageCount }, (v, k) => k + 1).filter(i => i && i >= left && i < right);

    if (result.length > 1) {
      // Add first page and dots
      if (result[0] > 1) {
        if (result[0] > 2) {
          result.unshift('...');
        }
        result.unshift(1);
      }

      // Add dots and last page
      if (result[result.length - 1] < pageCount) {
        if (result[result.length - 1] !== pageCount - 1) {
          result.push('...');
        }
        result.push(pageCount);
      }
    }

    return result;
  }

  resetLoadEvents() {
    this.eventsActive = true;
    this.searchActive = false;
  }

  loadEvents(page) {
    this.resetLoadEvents();

    const queries = {
      assetId: this.assetId
    };

    this.assets.getEvents(queries, page)
      .then((r: any) => {
        this.json = r.data.results;
        const resp = this.assets.parseEvents(r.data);
        this.events = resp.events;
        this.currentEventsPage = page + 1;
        this.resultCountEvents = resp.resultCount;
        this.totalEventsPages = Math.ceil(this.resultCountEvents / this.perPage);
        this.pagination = this.paginationGenerate(this.currentEventsPage, this.totalEventsPages);
      })
      .catch(err => {
        console.log('Load events error: ', err);
      });
  }

  resetSearch() {
    this.searchActive = true;
    this.eventsActive = false;
  }

  search(page = 0) {
    const search = this.el.nativeElement.querySelector('#search').value;
    const select = this.el.nativeElement.querySelector('#select').value;
    this.searchPlaceholder = 'ie. sold';
    if (search.length < 1) {
      if (this.searchActive) {
        this.loadEvents(0);
      } else {
        this.searchPlaceholder = 'Please type something first';
      }
      return;
    }
    this.resetSearch();

    const searchValues = search.split(',');
    const queries = {
      assetId: this.assetId
    };

    switch (select) {
      case 'type':
        queries['data[type]'] = `${searchValues[0].trim()}`;
        break;
    }

    this.assets.getEvents(queries, page)
      .then((r: any) => {
        this.json = r.data.results;
        const resp = this.assets.parseEvents(r.data);
        this.events = resp.events;
        this.currentSearchPage = page + 1;
        this.resultCountSearch = resp.resultCount;
        this.totalSearchPages = Math.ceil(this.resultCountSearch / this.perPage);
        this.pagination = this.paginationGenerate(this.currentSearchPage, this.totalSearchPages);
      })
      .catch(err => {
        console.log('Load events error: ', err);
      });
  }
}
