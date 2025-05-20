module nori::post;

// use nori::user::User;
use std::string::String;
// use sui::clock::Clock;
// use sui::coin::Coin;
// use sui::sui::SUI;
// use sui::table::{Self, Table};
// use sui::vec_map::{Self, VecMap};
// use sui::vec_set::{Self, VecSet};

public struct Post has key, store {
    id: UID,
    public_content: String,
    content_blob_id: String,
}

#[allow(lint(self_transfer))]
public fun create_post(
    // _: &User,
    public_content: String,
    content_blob_id: String,
    ctx: &mut TxContext,
) {
    let post = Post {
        id: object::new(ctx),
        public_content,
        content_blob_id,
    };

    transfer::public_transfer(post, ctx.sender());
}
