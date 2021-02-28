import { Thumbnails, BaseAttributes, Base, Playlist } from ".";
import { YoutubeRawData } from "../common";
import Channel from "./Channel";

/** @hidden */
interface PlaylistCompactAttributes extends BaseAttributes {
	title: string;
	thumbnails: Thumbnails;
	channel?: Channel;
	videoCount: number;
}

/** Represents a Compact Playlist (e.g. from search result, upNext / related of a video) */
export default class PlaylistCompact extends Base implements PlaylistCompactAttributes {
	/** The playlist's title */
	title!: string;
	/** Thumbnails of the playlist with different sizes */
	thumbnails!: Thumbnails;
	/** The channel that made this playlist */
	channel?: Channel;
	/** How many videos in this playlist */
	videoCount!: number;

	/** @hidden */
	constructor(playlist: Partial<PlaylistCompactAttributes> = {}) {
		super();
		Object.assign(this, playlist);
	}

	/**
	 * Load this instance with raw data from Youtube
	 *
	 * @hidden
	 */
	load(data: YoutubeRawData): PlaylistCompact {
		const {
			playlistId,
			title,
			thumbnail,
			shortBylineText,
			videoCount,
			videoCountShortText,
		} = data;

		this.id = playlistId;
		this.title = title.simpleText || title.runs[0].text;
		this.videoCount =
			+(videoCount ?? videoCountShortText.simpleText)?.replace(/[^0-9]/g, "") || 0;

		// Thumbnail
		let { thumbnails } = data;
		if (!thumbnails) thumbnails = thumbnail.thumbnails;
		else thumbnails = thumbnails[0].thumbnails;
		this.thumbnails = new Thumbnails().load(thumbnails);

		// Channel
		if (shortBylineText && shortBylineText.simpleText !== "YouTube") {
			this.channel = new Channel({
				id: shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
				name: shortBylineText.runs[0].text,
				url: `https://www.youtube.com${shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
				client: this.client,
			});
		}

		return this;
	}

	/**
	 * Get {@link Playlist} object based on current playlist id
	 *
	 * Equivalent to
	 * ```js
	 * client.getPlaylist(playlistCompact.id);
	 * ```
	 */
	async getPlaylist(): Promise<Playlist | undefined> {
		return await this.client.getPlaylist(this.id);
	}
}
