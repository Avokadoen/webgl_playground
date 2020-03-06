import { from, of, Observable, throwError } from 'rxjs';
import { switchMap, tap, filter, shareReplay, map } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';

interface ReadStreamCrawler {
    parsed: string;
    streamPos: ReadableStreamReadResult<Uint8Array> | null;
    reader: ReadableStreamDefaultReader<Uint8Array>;
}

export class ShaderLoader {
    private readonly utf8Decoder: TextDecoder;

    constructor() {
        this.utf8Decoder = new TextDecoder();
    }

    public fetchShaderSource(location: string): Observable<string> {
        return this.loadShaderSource(location).pipe(
          tap(value => (!value) ? console.error('Loaded shader was null') : null),
          filter(value => !!value),
          switchMap((body: ReadableStream<Uint8Array>) => {
            
            const reader = body.getReader();
            return of(reader);
          }),
          switchMap((reader: ReadableStreamDefaultReader<Uint8Array>) => {
            const crawler: ReadStreamCrawler = { parsed: '', streamPos: null, reader: reader };
            return this.readStreamResult(crawler);
          }),
          map((crawler: ReadStreamCrawler) => crawler.parsed),
          shareReplay(2)
        );
    }

    // Crawls the ReadableStreamResult from the response body until the whole body is read
    private readStreamResult(crawl: ReadStreamCrawler): Observable<ReadStreamCrawler> {
        if (crawl.streamPos !== null) {
            crawl.parsed += this.utf8Decoder.decode(crawl.streamPos.value) ?? '';
            if (crawl.streamPos.done) {
                return of(crawl); 
            }
        }

        return from(crawl.reader.read()).pipe(
            switchMap((streamPos: ReadableStreamReadResult<Uint8Array>) => {
                const crawler: ReadStreamCrawler = {parsed: crawl.parsed, streamPos, reader: crawl.reader};
                return of(crawler);
            }),
            switchMap((crawler: ReadStreamCrawler) => this.readStreamResult(crawler))
        );
    }

    /// Fetches shader relative to the shaders location
    private loadShaderSource(location: string): Observable<ReadableStream<Uint8Array> | null>  {
        return fromFetch(`../assets/shaders/${location}`).pipe(
            switchMap((response: Response) => {
                if (!response.ok) {
                    throwError(`Failed to retrieve shader as ${location}`)
                }
                
                return of(response.body)
            })
        );
    }
}