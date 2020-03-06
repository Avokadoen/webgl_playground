import { from, of, Observable, throwError } from 'rxjs';
import { switchMap, tap, filter, shareReplay, map } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';
import { Shader, ShaderType } from '../models/shader.model';

interface ReadStreamCrawler {
    parsed: string;
    streamPos: ReadableStreamReadResult<Uint8Array> | null;
    reader: ReadableStreamDefaultReader<Uint8Array>;
}

export namespace ShaderLoading {
    export function fetchShaderSource(location: string): Observable<Shader> {
        const shaderType = ShaderType.fromExtension(location);
        if (shaderType === ShaderType.Unkown) {
            throwError(`Could not interperate shader type from ${location}`)
        }
    
        return ShaderLoadingInternal.loadShaderSource(location).pipe(
          tap(value => (!value) ? console.error('Loaded shader was null') : null),
          filter(value => !!value),
          switchMap((body: ReadableStream<Uint8Array>) => {
            const reader = body.getReader();
            return of(reader);
          }),
          switchMap((reader: ReadableStreamDefaultReader<Uint8Array>) => {
            const crawler: ReadStreamCrawler = { parsed: '', streamPos: null, reader: reader };
            return ShaderLoadingInternal.readStreamResult(crawler);
          }),
          map((crawler: ReadStreamCrawler) => {
              const shader: Shader = {
                type: shaderType,
                source: crawler.parsed
              }
              return shader;
            }),
          shareReplay(2)
        );
    }
    
}

namespace ShaderLoadingInternal {
    const utf8Decoder = new TextDecoder();

    // Crawls the ReadableStreamResult from the response body until the whole body is read
    export function readStreamResult(crawl: ReadStreamCrawler): Observable<ReadStreamCrawler> {
        if (crawl.streamPos !== null) {
            crawl.parsed += utf8Decoder.decode(crawl.streamPos.value) ?? '';
            if (crawl.streamPos.done) {
                return of(crawl); 
            }
        }

        return from(crawl.reader.read()).pipe(
            switchMap((streamPos: ReadableStreamReadResult<Uint8Array>) => {
                const crawler: ReadStreamCrawler = {parsed: crawl.parsed, streamPos, reader: crawl.reader};
                return of(crawler);
            }),
            switchMap((crawler: ReadStreamCrawler) => readStreamResult(crawler))
        );
    }

    /// Fetches shader relative to the shaders location
    export function loadShaderSource(location: string): Observable<ReadableStream<Uint8Array> | null>  {
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